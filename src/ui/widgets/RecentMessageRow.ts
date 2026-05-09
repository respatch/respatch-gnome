import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { _ } from '../../gettext.js';
import type { RecentMessage } from '../../models/RecentMessage.js';
import type { RowController } from './PollingSection.js';
import { formatDuration } from '../../utils/format.js';
import type { BrowserService } from '../../services/BrowserService.js';

/**
 * Callback fired when the user clicks the transport pill of a row.
 * In the future it will navigate to a transport-detail window.
 */
export type TransportClickHandler = (transport: string) => void;

/**
 * Row representing a single recently-handled message.
 *
 * Layout (Adw.ActionRow):
 *   prefix : success/error icon (depending on `status`)
 *   title  : message id (#429)
 *   subtitle : status text or "OK", with handled-at timestamp
 *   suffix : transport pill button (clickable), duration label, memory label
 */
export class RecentMessageRow implements RowController<RecentMessage> {
    private readonly row: Adw.ActionRow;
    private readonly icon: Gtk.Image;
    private readonly transportButton: Gtk.Button;
    private readonly durationLabel: Gtk.Label;
    private readonly memoryLabel: Gtk.Label;
    private currentClass: string = '';

    constructor(
        private readonly uiDir: string,
        private readonly browserService: BrowserService,
        private readonly onTransportClick?: TransportClickHandler,
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/recent_message_row.ui`);

        this.row = builder.get_object('row') as Adw.ActionRow;
        this.icon = builder.get_object('icon') as Gtk.Image;
        this.transportButton = builder.get_object('transport_button') as Gtk.Button;
        this.durationLabel = builder.get_object('duration_label') as Gtk.Label;
        this.memoryLabel = builder.get_object('memory_label') as Gtk.Label;

        this.transportButton.connect('clicked', () => {
            const t = this.transportButton.label;
            if (t && this.onTransportClick) {
                this.onTransportClick(t);
            }
        });

        // Adw.ActionRow má vlastný `activated` signál, ktorý sa vyvolá keď je
        // activatable a používateľ na riadok klikne. Toto je spoľahlivejšie ako
        // `row-activated` na ListBoxe pri Adw.ActionRow s interaktívnymi suffixmi.
        this.row.connect('activated', () => {
            this.openMessageType();
        });
    }

    update(item: RecentMessage): void {
        const failed = item.status !== null;

        this.icon.icon_name = failed ? 'dialog-error-symbolic' : 'radio-checked-symbolic';
        if (failed) {
            this.icon.add_css_class('error');
            this.icon.remove_css_class('success');
        } else {
            this.icon.remove_css_class('error');
            this.icon.add_css_class('success');
        }

        this.currentClass = item.class;
        this.row.title = `#${item.title}`;
        this.row.subtitle = `${item.status ?? _('OK')}\n${this.formatHandledAt(item.handledAt)}`;

        this.transportButton.label = item.transport;
        this.durationLabel.label = formatDuration(item.duration);
        this.memoryLabel.label = item.memory;
    }

    openMessageType(): void {
        if (this.currentClass) {
            this.browserService.openUrl(this.browserService.getMessageTypeUrl(this.currentClass));
        }
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row;
    }

    private formatHandledAt(iso: string): string {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso;
            return d.toLocaleString();
        } catch {
            return iso;
        }
    }
}
