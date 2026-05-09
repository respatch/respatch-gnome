import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';

Adw.init();
const about = new Adw.AboutWindow();
try {
    about.application_name = "Respatch";
    about.developer_name = "Jozef Môstka";
    console.log("developer_name ok");
} catch(e) { console.log(e); }

try {
    about.comments = "Test comment";
    console.log("comments ok");
} catch(e) { console.log("no comments: " + e); }

try {
    about.developers = ["Jozef Môstka https://github.com/tito10047/"];
    console.log("developers ok");
} catch(e) { console.log("no developers: " + e); }

try {
    about.website = "https://github.com/respatch/respatch-gnome";
    console.log("website ok");
} catch(e) { console.log("no website: " + e); }

try {
    about.issue_url = "https://github.com/respatch/respatch-gnome/issues";
    console.log("issue_url ok");
} catch(e) { console.log("no issue_url: " + e); }
