import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import { WelcomeWindow } from './ui/windows/WelcomeWindow.js';
import { MainWindow } from './ui/windows/MainWindow.js';
import { SettingsWindow } from './ui/windows/SettingsWindow.js';
import { ProjectStore } from './stores/ProjectStore.js';
import { ApiClient } from './services/ApiClient.js';
import { LoggerService } from './services/LoggerService.js';
import { SettingsService } from './services/SettingsService.js';

export class WindowManager {
    constructor(
        private app: Adw.Application,
        private uiDir: string,
        private store: ProjectStore,
        private apiClient: ApiClient,
        private settingsService: SettingsService,
        private logger: LoggerService
    ) {}

    showWelcome() {
        this.logger.debug('Showing Welcome window');
        const welcome = new WelcomeWindow(
            this.app,
            this.uiDir,
            this.apiClient,
            this.store,
            this.logger,
            () => this.showMain()
        );
        welcome.present();
    }

    showMain() {
        this.logger.debug('Showing Main window');
        const main = new MainWindow(
            this.app,
            this.uiDir,
            this
        );
        main.present();
    }

    showSettings(parent: Gtk.Window) {
        this.logger.debug('Opening Settings window');
        const settings = new SettingsWindow(
            this.uiDir,
            this.settingsService,
            this.logger
        );
        settings.window.set_transient_for(parent);
        settings.present();
    }
}
