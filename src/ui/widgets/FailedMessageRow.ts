import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { _ } from '../../gettext.js';
import type { FailedMessage } from '../../models/FailedMessage.js';
import type { RowController } from './PollingSection.js';

export type FailedMessageActionHandler = (messageId: number, action: 'retry' | 'delete') => void;

export class FailedMessageRow implements RowController<FailedMessage> {
    private readonly row: Adw.ActionRow;
    private readonly icon: Gtk.Image;
    private readonly deleteButton: Gtk.Button;
    private readonly retryButton: Gtk.Button;
    private currentId: number | null = null;

    constructor(private readonly uiDir: string, private readonly onActionClick?: FailedMessageActionHandler) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/failed_message_row.ui`);

        this.row = builder.get_object('row') as Adw.ActionRow;
        this.icon = builder.get_object('icon') as Gtk.Image;
        this.deleteButton = builder.get_object('delete_button') as Gtk.Button;
        this.retryButton = builder.get_object('retry_button') as Gtk.Button;

        this.deleteButton.connect('clicked', () => {
            if (this.currentId !== null && this.onActionClick) {
                this.onActionClick(this.currentId, 'delete');
            }
        });

        this.retryButton.connect('clicked', () => {
            if (this.currentId !== null && this.onActionClick) {
                this.onActionClick(this.currentId, 'retry');
            }
        });
    }

    update(item: FailedMessage): void {
        this.currentId = item.id;

        this.row.title = item.title;
        const timeStr = this.formatDispatched(item.dispatched);
        
        if (item.exception === null) {
            this.row.subtitle = timeStr;
            this.icon.icon_name = 'emblem-ok-symbolic';
            this.icon.add_css_class('success');
            this.icon.remove_css_class('error');
        } else {
            const errorDesc = item.exception.description ?? _('Neznáma chyba');
            this.row.subtitle = `${errorDesc} • ${timeStr}`;
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
