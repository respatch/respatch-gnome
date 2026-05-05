import gettext from 'gettext';

const domain = 'respatch';
gettext.textdomain(domain);
gettext.bindtextdomain(domain, '/usr/share/locale');

export const _ = gettext.gettext;
export const ngettext = gettext.ngettext;