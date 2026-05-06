import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { SettingsService } from '../../services/SettingsService.js';
import { LoggerService } from '../../services/LoggerService.js';

export class SettingsWindow {
    public window: Adw.PreferencesWindow;

    constructor(
        uiDir: string,
        private settingsService: SettingsService,
        private logger: LoggerService
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/settings.ui`);

        this.window = builder.get_object('settings_window') as Adw.PreferencesWindow;

        const loggingRow = builder.get_object('logging_enabled_row') as Adw.SwitchRow;
        const logToFileRow = builder.get_object('log_to_file_row') as Adw.SwitchRow;

        // Sync state from settings
        loggingRow.set_active(this.settingsService.getLoggingEnabled());
        logToFileRow.set_active(this.settingsService.getLogToFile());

        // Connect signals
        loggingRow.connect('notify::active', () => {
            const active = loggingRow.get_active();
            this.settingsService.setLoggingEnabled(active);
            this.logger.setEnabled(active);
        });

        logToFileRow.connect('notify::active', () => {
            const active = logToFileRow.get_active();
            this.settingsService.setLogToFile(active);
        });
    }

    present() {
        this.window.present();
    }
}
