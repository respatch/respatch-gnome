import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';

const app = new Adw.Application({
    application_id: 'sk.dsidata.respatch',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect('activate', () => {
    const file = Gio.File.new_for_uri(import.meta.url);
    const dir = file.get_parent()?.get_path();
    const uiPath = dir + '/ui/window.ui';

    const builder = new Gtk.Builder();
    builder.add_from_file(uiPath);
    
    const window = builder.get_object('window') as Adw.ApplicationWindow;
    window.set_application(app);
    window.present();
});

app.run([import.meta.url]);
