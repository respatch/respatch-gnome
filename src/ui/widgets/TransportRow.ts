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
        const clampedFraction = Math.min(1, Math.max(0, fraction));
        this.progressBar.fraction = clampedFraction;

        this._updateProgressBarColor(clampedFraction);
    }

    private _updateProgressBarColor(fraction: number): void {
        const styleContext = this.progressBar.get_style_context();
        for (const cls of ['progress-empty', 'progress-green', 'progress-yellow', 'progress-orange', 'progress-red']) {
            styleContext.remove_class(cls);
        }

        if (fraction === 0) {
            styleContext.add_class('progress-empty');
        } else if (fraction < 0.5) {
            styleContext.add_class('progress-green');
        } else if (fraction < 0.75) {
            styleContext.add_class('progress-yellow');
        } else if (fraction < 0.9) {
            styleContext.add_class('progress-orange');
        } else {
            styleContext.add_class('progress-red');
        }
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row;
    }
}
