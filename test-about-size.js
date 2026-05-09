import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';

Adw.init();
const about = new Adw.AboutWindow({
    default_width: 450
});
let [w, h] = about.get_default_size();
console.log(`Default size: ${w}x${h}`);
