import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from 'gi://GLib';
import { _ } from '../../gettext.js';
import type { LoggerService } from '../../services/LoggerService.js';

/**
 * Definition of a row widget controlled by a {@link PollingSection}.
 *
 * `TItem` is the data shape coming from the API. The row is responsible for
 * rendering and updating itself when {@link RowController.update} is called.
 */
export interface RowController<TItem> {
    /** Returns the underlying GTK widget which gets appended to the ListBox. */
    getWidget(): Gtk.ListBoxRow;
    /** Updates the row content with new data. */
    update(item: TItem): void;
}

/**
 * Configuration for a polling section.
 *
 * `TItem`     — type of a single entry returned by the API.
 * `TResponse` — raw response shape returned by the {@link PollingSectionConfig.fetcher}.
 *               It will be normalized into an iterable of items by {@link PollingSectionConfig.toItems}.
 */
export interface PollingSectionConfig<TItem, TResponse> {
    /** Human-readable section name used for log messages. */
    name: string;
    /** ListBox that hosts the rows. */
    listBox: Gtk.ListBox;
    /**
     * When `true` the entire `containerWidget` is hidden whenever the section
     * has no rows and shown again once rows appear.  Polling continues in the
     * background regardless.
     *
     * When `false` (default) an empty-state placeholder label is shown inside
     * the listBox instead.  The placeholder text is taken from `emptyPlaceholder`.
     */
    hideWhenEmpty?: boolean;
    /**
     * Text shown as a placeholder row when `hideWhenEmpty` is `false` and the
     * section contains no data rows.  Required when `hideWhenEmpty` is `false`.
     */
    emptyPlaceholder?: string;
    /**
     * The widget that wraps the whole section (e.g. a `Gtk.Box` containing the
     * `Adw.PreferencesGroup`).  Used only when `hideWhenEmpty` is `true` — the
     * widget is hidden/shown based on whether rows are present.
     */
    containerWidget?: Gtk.Widget;
    /** Optional pause/resume button. If omitted, polling cannot be paused from the UI. */
    pauseButton?: Gtk.Button;
    /** Optional ToastOverlay for showing error toasts. */
    toastOverlay?: Adw.ToastOverlay;
    /**
     * Maximum number of rows to display at once.  When the API returns more
     * items than this limit, only the first `maxRows` items are rendered and a
     * button (`overflowButton`) is shown to indicate that more items exist.
     * If omitted (or `0`), all rows are displayed.
     */
    maxRows?: number;
    /**
     * Button shown next to the section heading when the number of items
     * exceeds `maxRows`.  The button should be hidden by default in the UI
     * file; `PollingSection` will show/hide it automatically and connect its
     * `clicked` signal to open the overflow URL in the browser.
     *
     * Requires `onOverflowOpen` to be set as well.
     */
    overflowButton?: Gtk.Button;
    /**
     * Called when the user clicks `overflowButton`.  Should open the relevant
     * URL in the browser (e.g. via `BrowserService.openUrl`).
     */
    onOverflowOpen?: () => void;
    /** Polling interval in seconds. */
    intervalSeconds: number;
    /** Logger used for warnings on failed fetches. */
    logger: LoggerService;
    /** Performs the network request. */
    fetcher: () => Promise<TResponse>;
    /** Normalizes the raw response into a list of items. */
    toItems: (response: TResponse) => Iterable<TItem>;
    /** Returns a stable identifier for an item — used for diff updates. */
    keyOf: (item: TItem) => string;
    /** Creates a new row controller for an item that did not exist yet. */
    createRow: (item: TItem) => RowController<TItem>;
    /**
     * Called after every successful render with the stable keys of ALL currently
     * visible items.  Use this to drive side-effects such as system notifications.
     */
    onRenderedKeys?: (keys: string[]) => void;
}

/**
 * Generic, reusable section that periodically fetches data and renders it as
 * rows in a Gtk.ListBox. Existing rows are updated in place; missing rows are
 * removed; new rows are appended. Supports pause/resume via an optional button.
 *
 * Designed to be shared across MainWindow's three refreshable panels
 * (Transports, Recent messages, ... future).
 */
export class PollingSection<TItem, TResponse> {
    private readonly rows = new Map<string, RowController<TItem>>();
    private pollSourceId: number | null = null;
    private paused = false;

    private isConnected: boolean = true;
    private hasShownErrorToast: boolean = false;
    private placeholderRow: Gtk.Widget | null = null;
    private emptyPlaceholderRow: Gtk.ListBoxRow | null = null;
    private overflowCount: number = 0;

    constructor(private readonly config: PollingSectionConfig<TItem, TResponse>) {
        if (this.config.pauseButton) {
            this.config.pauseButton.connect('clicked', () => this.togglePause());
        }

        if (this.config.overflowButton && this.config.onOverflowOpen) {
            this.config.overflowButton.connect('clicked', () => this.config.onOverflowOpen!());
            this.config.overflowButton.set_visible(false);
        }

        // Initial visibility state
        if (this.config.hideWhenEmpty && this.config.containerWidget) {
            this.config.containerWidget.set_visible(false);
        }
    }

    /** Starts polling immediately (no-op if already running or paused). */
    start(): void {
        if (this.paused || this.pollSourceId !== null) return;

        void this.fetchAndRender();
        this.pollSourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this.config.intervalSeconds,
            () => {
                void this.fetchAndRender();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    /** Stops the polling loop without changing the paused flag. */
    stop(): void {
        if (this.pollSourceId !== null) {
            GLib.source_remove(this.pollSourceId);
            this.pollSourceId = null;
        }
    }

    /**
     * Restarts polling unless paused — useful when the underlying data source
     * changes (e.g. active project switched).
     */
    restart(): void {
        this.stop();
        this.clearRows();
        if (!this.paused) {
            this.start();
        }
    }

    /**
     * Manually removes an item from the section.
     */
    removeItem(key: string): void {
        const row = this.rows.get(key);
        if (row) {
            this.config.listBox.remove(row.getWidget());
            this.rows.delete(key);
        }
    }

    private togglePause(): void {
        this.paused = !this.paused;
        const btn = this.config.pauseButton!;
        if (this.paused) {
            this.stop();
            btn.icon_name = 'media-playback-start-symbolic';
            btn.tooltip_text = _('Resume auto-refresh');
        } else {
            btn.icon_name = 'media-playback-pause-symbolic';
            btn.tooltip_text = _('Pause auto-refresh');
            this.start();
        }
    }

    private async fetchAndRender(): Promise<void> {
        try {
            const response = await this.config.fetcher();
            
            if (!this.isConnected) {
                this.isConnected = true;
                this.hasShownErrorToast = false;
                
                if (this.placeholderRow) {
                    this.config.listBox.remove(this.placeholderRow);
                    this.placeholderRow = null;
                }
            }
            
            this.render(response);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.config.logger.warn(`[${this.config.name}] Nepodarilo sa načítať dáta: ${msg}`);
            
            this.isConnected = false;
            
            if (this.rows.size === 0) {
                if (!this.placeholderRow) {
                    const statusPage = new Adw.StatusPage({
                        title: _('Failed to load data'),
                        description: _('Server is currently unavailable.'),
                        icon_name: 'network-offline-symbolic',
                    });
                    this.placeholderRow = statusPage;
                    this.config.listBox.append(this.placeholderRow);
                }
            } else {
                if (!this.hasShownErrorToast && this.config.toastOverlay) {
                    const toast = new Adw.Toast({
                        title: _('Failed to load data. Server is unavailable.'),
                        timeout: 5,
                    });
                    this.config.toastOverlay.add_toast(toast);
                    this.hasShownErrorToast = true;
                }
            }
        }
    }

    private render(response: TResponse): void {
        const seen = new Set<string>();
        const maxRows = this.config.maxRows ?? 0;
        let visibleCount = 0;
        let totalCount = 0;

        for (const item of this.config.toItems(response)) {
            const key = this.config.keyOf(item);
            totalCount++;

            if (maxRows > 0 && totalCount > maxRows) {
                // Item is beyond the limit — remove it if it was previously rendered.
                const existing = this.rows.get(key);
                if (existing) {
                    this.config.listBox.remove(existing.getWidget());
                    this.rows.delete(key);
                }
                continue;
            }

            seen.add(key);
            visibleCount++;

            const existing = this.rows.get(key);
            if (existing) {
                existing.update(item);
            } else {
                const row = this.config.createRow(item);
                row.update(item);
                this.rows.set(key, row);
                this.config.listBox.append(row.getWidget());
            }
        }

        this.overflowCount = Math.max(0, totalCount - visibleCount);

        // Remove rows that are no longer present in the response.
        for (const [key, row] of this.rows) {
            if (!seen.has(key)) {
                this.config.listBox.remove(row.getWidget());
                this.rows.delete(key);
            }
        }

        this.updateOverflowButton();
        this.updateEmptyState();

        if (this.config.onRenderedKeys) {
            this.config.onRenderedKeys([...this.rows.keys()]);
        }
    }

    /**
     * Shows or hides the overflow button based on whether there are items
     * beyond the `maxRows` limit.
     */
    private updateOverflowButton(): void {
        const btn = this.config.overflowButton;
        if (!btn) return;

        const hasOverflow = this.overflowCount > 0;
        btn.set_visible(hasOverflow);
        if (hasOverflow) {
            btn.set_tooltip_text(
                _('Showing %d of %d messages. Click to open all in browser.')
                    .replace('%d', String(this.rows.size))
                    .replace('%d', String(this.rows.size + this.overflowCount))
            );
        }
    }

    /**
     * Updates visibility / placeholder based on whether the section has rows.
     * - `hideWhenEmpty=true`:  hides/shows `containerWidget`.
     * - `hideWhenEmpty=false`: shows/hides an `emptyPlaceholder` label row.
     */
    private updateEmptyState(): void {
        const isEmpty = this.rows.size === 0;

        if (this.config.hideWhenEmpty) {
            if (this.config.containerWidget) {
                this.config.containerWidget.set_visible(!isEmpty);
            }
        } else {
            if (isEmpty) {
                if (!this.emptyPlaceholderRow && this.config.emptyPlaceholder) {
                    const label = new Gtk.Label({
                        label: this.config.emptyPlaceholder,
                        margin_top: 18,
                        margin_bottom: 18,
                    });
                    label.add_css_class('dim-label');
                    const row = new Gtk.ListBoxRow({
                        selectable: false,
                        activatable: false,
                    });
                    row.set_child(label);
                    this.emptyPlaceholderRow = row;
                    this.config.listBox.append(row);
                }
            } else {
                if (this.emptyPlaceholderRow) {
                    this.config.listBox.remove(this.emptyPlaceholderRow);
                    this.emptyPlaceholderRow = null;
                }
            }
        }
    }

    private clearRows(): void {
        for (const [, row] of this.rows) {
            this.config.listBox.remove(row.getWidget());
        }
        this.rows.clear();

        if (this.placeholderRow) {
            this.config.listBox.remove(this.placeholderRow);
            this.placeholderRow = null;
        }

        if (this.emptyPlaceholderRow) {
            this.config.listBox.remove(this.emptyPlaceholderRow);
            this.emptyPlaceholderRow = null;
        }

        this.isConnected = true;
        this.hasShownErrorToast = false;

        // After clearing, apply empty state immediately
        this.updateEmptyState();
    }
}
