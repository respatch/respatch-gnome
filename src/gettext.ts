import gettext from 'gettext';
import GLib from 'gi://GLib';

const domain = 'respatch';
gettext.textdomain(domain);

// Pre lokálny vývoj skúsime nájsť locale v aktuálnom adresári
const currentDir = GLib.get_current_dir();
gettext.bindtextdomain(domain, `${currentDir}/locale`);
gettext.bindtextdomain(domain, '/usr/share/locale');

export const _ = gettext.gettext;
export const ngettext = gettext.ngettext;