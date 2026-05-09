import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { _, ngettext } from '../../gettext.js';
import type { RowController } from './PollingSection.js';

export interface FailedTransportItem {
    transportName: string;
    count: number;
}

export class FailedTransportRow implements RowController<FailedTransportItem> {
    private row: Adw.ActionRow;

    constructor(
        public readonly transportName: string,
        private readonly uiDir: string,
        private readonly getTransportUrl: (transportName: string) => string,
        private readonly getPreferredBrowser: () => string,
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/failed_transport_row.ui`);

        this.row = builder.get_object('failed_transport_row') as Adw.ActionRow;

        this.row.connect('activated', () => {
            const url = this.getTransportUrl(this.transportName);
            this._openUrl(url);
        });
    }

    update(item: FailedTransportItem): void {
        this.row.set_title(item.transportName);
        const subtitle = ngettext(
            '%d správa čaká na zásah',
            '%d správy čakajú na zásah',
            item.count
        ).replace('%d', String(item.count));
        this.row.set_subtitle(subtitle);
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row as unknown as Gtk.ListBoxRow;
    }

    private _openUrl(url: string): void {
        const browser = this.getPreferredBrowser().trim();
        if (browser) {
            try {
                GLib.spawn_command_line_async(`${browser} ${url}`);
                return;
            } catch {
                // fall through to default
            }
        }
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
        } catch (e) {
            // nothing we can do
        }
    }
}
