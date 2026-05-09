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
    /** Optional pause/resume button. If omitted, polling cannot be paused from the UI. */
    pauseButton?: Gtk.Button;
    /** Optional ToastOverlay for showing error toasts. */
    toastOverlay?: Adw.ToastOverlay;
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

    constructor(private readonly config: PollingSectionConfig<TItem, TResponse>) {
        if (this.config.pauseButton) {
            this.config.pauseButton.connect('clicked', () => this.togglePause());
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
            btn.tooltip_text = _('Obnoviť obnovovanie');
        } else {
            btn.icon_name = 'media-playback-pause-symbolic';
            btn.tooltip_text = _('Pozastaviť obnovovanie');
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
                        title: _('Nepodarilo sa načítať dáta'),
                        description: _('Server je momentálne nedostupný.'),
                        icon_name: 'network-offline-symbolic',
                    });
                    this.placeholderRow = statusPage;
                    this.config.listBox.append(this.placeholderRow);
                }
            } else {
                if (!this.hasShownErrorToast && this.config.toastOverlay) {
                    const toast = new Adw.Toast({
                        title: _('Nepodarilo sa načítať dáta. Server je nedostupný.'),
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

        for (const item of this.config.toItems(response)) {
            const key = this.config.keyOf(item);
            seen.add(key);

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

        // Remove rows that are no longer present in the response.
        for (const [key, row] of this.rows) {
            if (!seen.has(key)) {
                this.config.listBox.remove(row.getWidget());
                this.rows.delete(key);
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
        this.isConnected = true;
        this.hasShownErrorToast = false;
    }
}
