import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
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
    }

    present() {
        this.window.present();
    }
}
