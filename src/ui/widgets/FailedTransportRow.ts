import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { ngettext } from '../../gettext.js';
import type { RowController } from './PollingSection.js';
import type { BrowserService } from '../../services/BrowserService.js';

export interface FailedTransportItem {
    transportName: string;
    count: number;
}

export class FailedTransportRow implements RowController<FailedTransportItem> {
    private row: Adw.ActionRow;

    constructor(
        public readonly transportName: string,
        private readonly uiDir: string,
        private readonly browserService: BrowserService,
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/failed_transport_row.ui`);

        this.row = builder.get_object('failed_transport_row') as Adw.ActionRow;

        this.row.connect('activated', () => {
            const url = this.browserService.getTransportUrl(this.transportName);
            this.browserService.openUrl(url);
        });
    }

    update(item: FailedTransportItem): void {
        this.row.set_title(item.transportName);
        const subtitle = ngettext(
            '%d message waiting for intervention',
            '%d messages waiting for intervention',
            item.count
        ).replace('%d', String(item.count));
        this.row.set_subtitle(subtitle);
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row as unknown as Gtk.ListBoxRow;
    }
}
