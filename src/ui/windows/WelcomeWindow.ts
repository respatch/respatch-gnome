import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import GLib from 'gi://GLib';
import { AddProjectDialog } from '../dialogs/AddProjectDialog.js';
import { ApiClient } from '../../services/ApiClient.js';
import { ProjectStore } from '../../stores/ProjectStore.js';
import { LoggerService } from '../../services/LoggerService.js';

export class WelcomeWindow {
    private window: Adw.ApplicationWindow;

    constructor(
        app: Adw.Application,
        private uiDir: string,
        private apiClient: ApiClient,
        private store: ProjectStore,
        private logger: LoggerService,
        private onProjectAdded: () => void
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/window.ui`);

        this.window = builder.get_object('window') as Adw.ApplicationWindow;
        this.window.set_application(app);

        const addProjectBtn = builder.get_object('add_project_button') as Gtk.Button;
        if (addProjectBtn) {
            addProjectBtn.connect('clicked', () => {
                const dialog = new AddProjectDialog(
                    this.window,
                    this.uiDir,
                    this.apiClient,
                    this.store,
                    this.logger,
                    () => {
                        this.window.close();
                        this.onProjectAdded();
                    }
                );
                dialog.present();
            });
        }

        const liveDemoBtn = builder.get_object('live_demo_button') as Gtk.Button;
        if (liveDemoBtn) {
            liveDemoBtn.connect('clicked', () => {
                const token = 'some_secure_hash_token_123';
                const servers = [
                    { name: 'Live Demo (Alfa)', url: 'https://alfa.respatch.mostka.sk/_respatch/api/', token },
                    { name: 'Live Demo (Beta)', url: 'https://beta.respatch.mostka.sk/_respatch/api/', token },
                    { name: 'Live Demo (Gama)', url: 'https://gama.respatch.mostka.sk/_respatch/api/', token }
                ];
                
                let firstId = '';
                servers.forEach((server, index) => {
                    const id = GLib.uuid_string_random();
                    if (index === 0) firstId = id;
                    this.store.addProject({ id, ...server });
                });
                
                this.store.setActiveProject(firstId);
                this.window.close();
                this.onProjectAdded();
            });
        }
    }

    present() {
        this.window.present();
    }
}
