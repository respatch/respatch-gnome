import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';

Adw.init();
const about = new Adw.AboutWindow({
    application_name: 'Respatch',
    developer_name: 'Jozef Môstka',
    website: 'https://github.com/respatch/respatch-gnome',
    issue_url: 'https://github.com/respatch/respatch-gnome/issues'
});
about.add_link('Jozef Môstka', 'https://github.com/tito10047/');

console.log("add_link works");
