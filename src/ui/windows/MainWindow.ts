import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { WindowManager } from '../../WindowManager.js';
import { ProjectStore } from '../../stores/ProjectStore.js';
import { ApiClient } from '../../services/ApiClient.js';
import { LoggerService } from '../../services/LoggerService.js';
import type { Project } from '../../models/Project.js';
import { TransportRow, TransportItem } from '../widgets/TransportRow.js';
import { RecentMessageRow } from '../widgets/RecentMessageRow.js';
import { PollingSection } from '../widgets/PollingSection.js';
import type { TransportsResponse } from '../../models/Transport.js';
import type { RecentMessage, RecentMessagesResponse } from '../../models/RecentMessage.js';

const POLL_INTERVAL_SECONDS = 10;

/**
 * Main application window. Acts as a thin orchestrator:
 *   - wires header buttons to {@link WindowManager},
 *   - keeps the server switcher in sync with {@link ProjectStore},
 *   - owns the refreshable {@link PollingSection}s (one per panel) and
 *     restarts them when the active project changes.
 *
 * All polling/diff/pause-button logic lives in {@link PollingSection};
 * MainWindow itself contains no GLib timers or row-bookkeeping anymore.
 */
export class MainWindow {
    private readonly window: Adw.ApplicationWindow;
    private readonly serverSwitcher: Gtk.DropDown;
    private readonly stringList: Gtk.StringList;
    private projects: Project[] = [];

    private readonly transportSection: PollingSection<TransportItem, TransportsResponse>;
    private readonly recentMessagesSection: PollingSection<RecentMessage, RecentMessagesResponse>;

    constructor(
        app: Adw.Application,
        uiDir: string,
        wm: WindowManager,
        private readonly store: ProjectStore,
        private readonly apiClient: ApiClient,
        private readonly logger: LoggerService
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/main.ui`);

        this.window = builder.get_object('window') as Adw.ApplicationWindow;
        this.window.set_application(app);

        this.wireHeaderButtons(builder, wm);

        this.serverSwitcher = builder.get_object('server_switcher') as Gtk.DropDown;
        this.stringList = new Gtk.StringList();
        this.setupServerSwitcher();

        this.transportSection = this.createTransportSection(builder, uiDir);
        this.recentMessagesSection = this.createRecentMessagesSection(builder, uiDir);

        this.transportSection.start();
        this.recentMessagesSection.start();
    }

    present(): void {
        this.window.present();
    }

    // ----- Header / navigation -------------------------------------------------

    private wireHeaderButtons(builder: Gtk.Builder, wm: WindowManager): void {
        const settingsBtn = builder.get_object('settings_button') as Gtk.Button | null;
        settingsBtn?.connect('clicked', () => wm.showSettings(this.window));

        const manageServersBtn = builder.get_object('manage_servers_button') as Gtk.Button | null;
        manageServersBtn?.connect('clicked', () => wm.showManageServers(this.window));
    }

    // ----- Server switcher -----------------------------------------------------

    private setupServerSwitcher(): void {
        this.serverSwitcher.set_model(this.stringList);

        this.store.connect('notify::active-project', () => {
            this.syncSwitcher();
            this.transportSection.restart();
            this.recentMessagesSection.restart();
        });

        this.serverSwitcher.connect('notify::selected-item', () => {
            const pos = this.serverSwitcher.get_selected();
            if (pos !== Gtk.INVALID_LIST_POSITION && this.projects[pos]) {
                this.store.setActiveProject(this.projects[pos].id);
            }
        });

        this.syncSwitcher();
    }

    private syncSwitcher(): void {
        this.projects = this.store.getProjects();
        const names = this.projects.map(p => p.name);
        this.stringList.splice(0, this.stringList.get_n_items(), names);

        const activeId = this.store.active_project;
        if (activeId) {
            const index = this.projects.findIndex(p => p.id === activeId);
            if (index !== -1) {
                this.serverSwitcher.set_selected(index);
            }
        }
    }

    // ----- Polling sections ----------------------------------------------------

    /** Returns the currently active project, or `null` if none is selected. */
    private getActiveProject(): Project | null {
        const activeId = this.store.active_project;
        if (!activeId) return null;
        return this.store.getProjects().find(p => p.id === activeId) ?? null;
    }

    private createTransportSection(builder: Gtk.Builder, uiDir: string): PollingSection<TransportItem, TransportsResponse> {
        const list = builder.get_object('transport_list') as Gtk.ListBox;
        const pauseBtn = builder.get_object('transport_pause_button') as Gtk.Button;

        return new PollingSection<TransportItem, TransportsResponse>({
            name: 'Transports',
            listBox: list,
            pauseButton: pauseBtn,
            intervalSeconds: POLL_INTERVAL_SECONDS,
            logger: this.logger,
            fetcher: () => {
                const p = this.getActiveProject();
                if (!p) return Promise.resolve({} as TransportsResponse);
                return this.apiClient.fetchTransports(p.url, p.token);
            },
            toItems: (response) => Object.entries(response).map(([name, info]) => ({ name, info })),
            keyOf: (item) => item.name,
            createRow: (item) => new TransportRow(item.name, uiDir),
        });
    }

    private createRecentMessagesSection(builder: Gtk.Builder, uiDir: string): PollingSection<RecentMessage, RecentMessagesResponse> {
        const list = builder.get_object('recent_messages_list') as Gtk.ListBox;
        const pauseBtn = builder.get_object('recent_messages_pause_button') as Gtk.Button;

        return new PollingSection<RecentMessage, RecentMessagesResponse>({
            name: 'RecentMessages',
            listBox: list,
            pauseButton: pauseBtn,
            intervalSeconds: POLL_INTERVAL_SECONDS,
            logger: this.logger,
            fetcher: () => {
                const p = this.getActiveProject();
                if (!p) return Promise.resolve([] as RecentMessagesResponse);
                return this.apiClient.fetchRecentMessages(p.url, p.token);
            },
            toItems: (response) => response,
            keyOf: (msg) => String(msg.id),
            createRow: () => new RecentMessageRow(uiDir, (transport) => {
                // Future: open transport-detail window via WindowManager.
                this.logger.info(`Klik na transport: ${transport}`);
            }),
        });
    }
}
