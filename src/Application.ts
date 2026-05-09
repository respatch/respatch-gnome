import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import Gdk from 'gi://Gdk?version=4.0';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { gjsFetch } from './libs/fetch.js';
import { SettingsService } from './services/SettingsService.js';
import { ProjectStore } from './stores/ProjectStore.js';
import { ApiClient } from './services/ApiClient.js';
import { LoggerService, ConsoleTransport, FileTransport, LogTransport } from './services/LoggerService.js';
import { WindowManager } from './WindowManager.js';

export const Application = GObject.registerClass({
    GTypeName: 'RespatchApplication',
}, class Application extends Adw.Application {
    private uiDir!: string;
    private settingsService!: SettingsService;
    private projectStore!: ProjectStore;
    private apiClient!: ApiClient;
    private logger!: LoggerService;
    private windowManager!: WindowManager;

    constructor() {
        super({
            application_id: 'sk.tito10047.respatch',
            flags: Gio.ApplicationFlags.FLAGS_NONE,
        });
    }

    vfunc_activate() {
        const file = Gio.File.new_for_uri(import.meta.url);
        this.uiDir = file.get_parent()?.get_path() || '';

        this.settingsService = new SettingsService();
        
        // Setup Logging
        const transports: LogTransport[] = [new ConsoleTransport()];
        
        const loggingEnabled = this.settingsService.getLoggingEnabled();
        const logToFile = this.settingsService.getLogToFile();

        if (logToFile) {
            const logDir = GLib.build_filenamev([GLib.get_user_data_dir(), 'respatch']);
            const logPath = GLib.build_filenamev([logDir, 'respatch.log']);
            transports.push(new FileTransport(logPath));
        }

        this.logger = new LoggerService(transports, loggingEnabled);
        this.logger.info('Application activated');

        this._loadStyle();

        this.apiClient = new ApiClient(gjsFetch);
        this.projectStore = new ProjectStore(this.settingsService);
        this.windowManager = new WindowManager(
            this,
            this.uiDir,
            this.projectStore,
            this.apiClient,
            this.settingsService,
            this.logger
        );

        if (this.projectStore.hasActiveProject()) {
            this.windowManager.showMain();
        } else {
            this.windowManager.showWelcome();
        }
    }

    private _loadStyle() {
        const provider = new Gtk.CssProvider();
        const stylePath = GLib.build_filenamev([this.uiDir, 'ui', 'style.css']);
        const styleFile = Gio.File.new_for_path(stylePath);
        
        try {
            provider.load_from_file(styleFile);
            Gtk.StyleContext.add_provider_for_display(
                Gdk.Display.get_default()!,
                provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
            this.logger.info(`CSS loaded from ${stylePath}`);
        } catch (e) {
            this.logger.error(`Failed to load CSS from ${stylePath}: ${e}`);
        }
    }
});

export type Application = InstanceType<typeof Application>;
