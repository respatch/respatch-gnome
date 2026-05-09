import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { _ } from '../../gettext.js';
import type { FailedMessage } from '../../models/FailedMessage.js';
import type { RowController } from './PollingSection.js';

export type FailedMessageActionHandler = (message: FailedMessage, action: 'retry' | 'delete') => void | Promise<void>;

export interface FailedMessageActionResult {
    message: FailedMessage;
    action: 'retry' | 'delete';
}

export class FailedMessageRow implements RowController<FailedMessage> {
    private readonly row: Adw.ActionRow;
    private readonly icon: Gtk.Image;
    private readonly deleteButton: Gtk.Button;
    private readonly retryButton: Gtk.Button;
    private readonly spinner: Gtk.Spinner;
    private currentItem: FailedMessage | null = null;

    constructor(private readonly uiDir: string, private readonly onActionClick?: FailedMessageActionHandler) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/failed_message_row.ui`);

        this.row = builder.get_object('row') as Adw.ActionRow;
        this.icon = builder.get_object('icon') as Gtk.Image;
        this.deleteButton = builder.get_object('delete_button') as Gtk.Button;
        this.retryButton = builder.get_object('retry_button') as Gtk.Button;
        this.spinner = builder.get_object('spinner') as Gtk.Spinner;

        this.deleteButton.connect('clicked', () => {
            if (this.currentItem !== null && this.onActionClick) {
                this.setBusy(true);
                void Promise.resolve(this.onActionClick(this.currentItem, 'delete'))
                    .finally(() => this.setBusy(false));
            }
        });

        this.retryButton.connect('clicked', () => {
            if (this.currentItem !== null && this.onActionClick) {
                this.setBusy(true);
                void Promise.resolve(this.onActionClick(this.currentItem, 'retry'))
                    .finally(() => this.setBusy(false));
            }
        });
    }

    private setBusy(busy: boolean): void {
        this.deleteButton.sensitive = !busy;
        this.retryButton.sensitive = !busy;
        this.spinner.visible = busy;
        if (busy) {
            this.spinner.start();
        } else {
            this.spinner.stop();
        }
    }

    update(item: FailedMessage): void {
        this.currentItem = item;

        this.row.title = item.title;
        const timeStr = this.formatDispatched(item.dispatched);
        const transportLabel = item.transport ? `[${item.transport}]` : '';

        if (item.exception === null) {
            this.row.subtitle = [transportLabel, timeStr].filter(Boolean).join(' • ');
            this.icon.icon_name = 'emblem-ok-symbolic';
            this.icon.add_css_class('success');
            this.icon.remove_css_class('error');
        } else {
            const errorDesc = item.exception.description ?? _('Unknown error');
            this.row.subtitle = [transportLabel, errorDesc, timeStr].filter(Boolean).join(' • ');
            this.icon.icon_name = 'dialog-error-symbolic';
            this.icon.add_css_class('error');
            this.icon.remove_css_class('success');
        }
    }

    getWidget(): Gtk.ListBoxRow {
        return this.row;
    }

    private formatDispatched(iso: string): string {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso;
            return d.toLocaleString();
        } catch {
            return iso;
        }
    }
}
