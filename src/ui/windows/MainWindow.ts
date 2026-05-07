import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from 'gi://GLib';
import { WindowManager } from '../../WindowManager.js';
import { ProjectStore } from '../../stores/ProjectStore.js';
import { ApiClient } from '../../services/ApiClient.js';
import { LoggerService } from '../../services/LoggerService.js';
import { TransportRow } from '../widgets/TransportRow.js';
import type { TransportsResponse } from '../../models/Transport.js';

const TRANSPORT_POLL_INTERVAL_SECONDS = 10;

export class MainWindow {
    private window: Adw.ApplicationWindow;
    private serverSwitcher: Gtk.DropDown;
    private stringList!: Gtk.StringList;
    private projects: import('../../models/Project.js').Project[] = [];

    private transportList!: Gtk.ListBox;
    private transportPauseButton!: Gtk.Button;
    private transportRows: Map<string, TransportRow> = new Map();
    private pollSourceId: number | null = null;
    private isPaused: boolean = false;

    constructor(
        app: Adw.Application,
        uiDir: string,
        wm: WindowManager,
        private store: ProjectStore,
        private apiClient: ApiClient,
        private logger: LoggerService
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/main.ui`);

        this.window = builder.get_object('window') as Adw.ApplicationWindow;
        this.window.set_application(app);

        const settingsBtn = builder.get_object('settings_button') as Gtk.Button;
        if (settingsBtn) {
            settingsBtn.connect('clicked', () => wm.showSettings(this.window));
        }

        const manageServersBtn = builder.get_object('manage_servers_button') as Gtk.Button;
        if (manageServersBtn) {
            manageServersBtn.connect('clicked', () => wm.showManageServers(this.window));
        }

        this.serverSwitcher = builder.get_object('server_switcher') as Gtk.DropDown;
        this.setupServerSwitcher();

        this.transportList = builder.get_object('transport_list') as Gtk.ListBox;
        this.transportPauseButton = builder.get_object('transport_pause_button') as Gtk.Button;
        this.setupTransportPolling();
    }

    private setupServerSwitcher() {
        this.stringList = new Gtk.StringList();
        this.serverSwitcher.set_model(this.stringList);

        this.store.connect('notify::active-project', () => {
            this.syncSwitcher();
            this.restartTransportPolling();
        });

        this.serverSwitcher.connect('notify::selected-item', () => {
            const selectedPosition = this.serverSwitcher.get_selected();
            if (selectedPosition !== Gtk.INVALID_LIST_POSITION && this.projects[selectedPosition]) {
                const selectedId = this.projects[selectedPosition].id;
                this.store.setActiveProject(selectedId);
            }
        });

        this.syncSwitcher();
    }

    private syncSwitcher() {
        this.projects = this.store.getProjects();
        const names = this.projects.map(p => p.name);

        // Gtk.StringList does not have clear/set_items, so we recreate it if needed
        // But actually stringList.splice(0, stringList.get_n_items(), names) is better
        this.stringList.splice(0, this.stringList.get_n_items(), names);

        const activeId = this.store.active_project;
        if (activeId) {
            const index = this.projects.findIndex(p => p.id === activeId);
            if (index !== -1) {
                this.serverSwitcher.set_selected(index);
            }
        }
    }

    private setupTransportPolling() {
        this.transportPauseButton.connect('clicked', () => this.togglePause());
        this.startTransportPolling();
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.stopTransportPolling();
            this.transportPauseButton.icon_name = 'media-playback-start-symbolic';
            this.transportPauseButton.tooltip_text = 'Obnoviť obnovovanie';
        } else {
            this.transportPauseButton.icon_name = 'media-playback-pause-symbolic';
            this.transportPauseButton.tooltip_text = 'Pozastaviť obnovovanie';
            this.startTransportPolling();
        }
    }

    private startTransportPolling() {
        this.fetchAndUpdateTransports();
        this.pollSourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            TRANSPORT_POLL_INTERVAL_SECONDS,
            () => {
                this.fetchAndUpdateTransports();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    private stopTransportPolling() {
        if (this.pollSourceId !== null) {
            GLib.source_remove(this.pollSourceId);
            this.pollSourceId = null;
        }
    }

    private restartTransportPolling() {
        if (!this.isPaused) {
            this.stopTransportPolling();
            this.startTransportPolling();
        }
    }

    private fetchAndUpdateTransports() {
        const activeId = this.store.active_project;
        if (!activeId) return;

        const project = this.store.getProjects().find(p => p.id === activeId);
        if (!project) return;

        this.apiClient.fetchTransports(project.url, project.token)
            .then((data: TransportsResponse) => this.updateTransportList(data))
            .catch((err: unknown) => {
                this.logger.warn(`Nepodarilo sa načítať transporty: ${err instanceof Error ? err.message : String(err)}`);
            });
    }

    private updateTransportList(data: TransportsResponse) {
        for (const [name, info] of Object.entries(data)) {
            const existing = this.transportRows.get(name);
            if (existing) {
                existing.update(info);
            } else {
                const row = new TransportRow(name);
                row.update(info);
                this.transportRows.set(name, row);
                this.transportList.append(row.getWidget());
            }
        }
    }

    present() {
        this.window.present();
    }
}
