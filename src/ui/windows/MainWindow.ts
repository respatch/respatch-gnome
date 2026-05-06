import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { WindowManager } from '../../WindowManager.js';

export class MainWindow {
    private window: Adw.ApplicationWindow;

    constructor(
        app: Adw.Application,
        uiDir: string,
        wm: WindowManager
    ) {
        const builder = new Gtk.Builder();
        builder.add_from_file(`${uiDir}/ui/main.ui`);

        this.window = builder.get_object('window') as Adw.ApplicationWindow;
        this.window.set_application(app);

        const settingsBtn = builder.get_object('settings_button') as Gtk.Button;
        if (settingsBtn) {
            settingsBtn.connect('clicked', () => wm.showSettings(this.window));
        }
    }

    present() {
        this.window.present();
    }
}
