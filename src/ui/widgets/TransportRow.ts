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

    constructor(public readonly transportName: string) {
        this.nameLabel = new Gtk.Label({
            label: transportName,
            hexpand: true,
            halign: Gtk.Align.START,
        });
        this.nameLabel.add_css_class('title');

        const icon = new Gtk.Image({ icon_name: 'network-server-symbolic' });
        icon.valign = Gtk.Align.CENTER;

        const headerBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });
        headerBox.append(icon);
        headerBox.append(this.nameLabel);

        this.subtitleLabel = new Gtk.Label({
            label: '',
            halign: Gtk.Align.START,
        });
        this.subtitleLabel.add_css_class('caption');

        this.progressBar = new Gtk.ProgressBar();
        this.progressBar.margin_top = 4;
        this.progressBar.add_css_class('worker-progress');

        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 4,
        });
        box.margin_start = 12;
        box.margin_end = 12;
        box.margin_top = 8;
        box.margin_bottom = 8;
        box.append(headerBox);
        box.append(this.subtitleLabel);
        box.append(this.progressBar);

        this.row = new Gtk.ListBoxRow();
        this.row.add_css_class('navigation-sidebar');
        this.row.set_child(box);
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
