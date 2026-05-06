import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { WindowManager } from '../../WindowManager.js';
import { ProjectStore } from '../../stores/ProjectStore.js';
import { ApiClient } from '../../services/ApiClient.js';
import { LoggerService } from '../../services/LoggerService.js';

export class MainWindow {
    private window: Adw.ApplicationWindow;
    private serverSwitcher: Gtk.DropDown;
    private stringList!: Gtk.StringList;
    private projects: import('../../models/Project.js').Project[] = [];

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
    }

    private setupServerSwitcher() {
        this.stringList = new Gtk.StringList();
        this.serverSwitcher.set_model(this.stringList);

        this.store.connect('notify::active-project', () => this.syncSwitcher());
        
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

    present() {
        this.window.present();
    }
}
