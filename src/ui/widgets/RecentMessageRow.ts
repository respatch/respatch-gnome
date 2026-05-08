import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { _ } from '../../gettext.js';
import type { RecentMessage } from '../../models/RecentMessage.js';
import type { RowController } from './PollingSection.js';
import { formatDuration } from '../../utils/format.js';

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

    constructor(private readonly onTransportClick?: TransportClickHandler) {
        this.row = new Adw.ActionRow({
            title_lines: 1,
            subtitle_lines: 2,
        });

        this.icon = new Gtk.Image({ icon_name: 'emblem-ok-symbolic' });
        this.row.add_prefix(this.icon);

        this.transportButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            tooltip_text: _('Zobraziť detail transportu'),
        });
        this.transportButton.add_css_class('pill');
        this.transportButton.add_css_class('flat');
        this.transportButton.connect('clicked', () => {
            const t = this.transportButton.label;
            if (t && this.onTransportClick) {
                this.onTransportClick(t);
            }
        });

        this.durationLabel = new Gtk.Label({ valign: Gtk.Align.CENTER });
        this.durationLabel.add_css_class('dim-label');

        this.memoryLabel = new Gtk.Label({ valign: Gtk.Align.CENTER });
        this.memoryLabel.add_css_class('dim-label');
        this.memoryLabel.add_css_class('caption');

        this.row.add_suffix(this.transportButton);
        this.row.add_suffix(this.durationLabel);
        this.row.add_suffix(this.memoryLabel);
    }

    update(item: RecentMessage): void {
        const failed = item.status !== null;

        this.icon.icon_name = failed ? 'dialog-error-symbolic' : 'emblem-ok-symbolic';
        if (failed) {
            this.icon.add_css_class('error');
        } else {
            this.icon.remove_css_class('error');
        }

        this.row.title = `#${item.title}`;
        this.row.subtitle = `${item.status ?? _('OK')}\n${this.formatHandledAt(item.handledAt)}`;

        this.transportButton.label = item.transport;
        this.durationLabel.label = formatDuration(item.duration);
        this.memoryLabel.label = item.memory;
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
