import Gtk from 'gi://Gtk?version=4.0';
import type { TransportInfo } from '../../models/Transport.js';
import type { RowController } from './PollingSection.js';

/** A single transport entry, identified by its `name`. */
export interface TransportItem {
    name: string;
    info: TransportInfo;
}

export class TransportRow implements RowController<TransportItem> {
    private row: Gtk.ListBoxRow;
    private nameLabel: Gtk.Label;
    private subtitleLabel: Gtk.Label;
    private progressBar: Gtk.ProgressBar;

    constructor(public readonly transportName: string, private readonly uiDir: string) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/transport_row.ui`);

        this.row = builder.get_object('row') as Gtk.ListBoxRow;
        this.nameLabel = builder.get_object('name_label') as Gtk.Label;
        this.subtitleLabel = builder.get_object('subtitle_label') as Gtk.Label;
        this.progressBar = builder.get_object('progress_bar') as Gtk.ProgressBar;

        this.nameLabel.label = transportName;
    }

    update(item: TransportItem): void {
        const info = item.info;
        const count = info.count !== null ? String(info.count) : '–';
        this.subtitleLabel.label = `${count} správ • ${info.workers} workerov • ${info.memory}`;

        const fraction = info.workers > 0 ? info.usedWorkers / info.workers : 0;
        this.progressBar.fraction = Math.min(1, Math.max(0, fraction));
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row;
    }
}
