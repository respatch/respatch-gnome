import Gio from 'gi://Gio';

const hasOwner = Gio.DBus.session.call_sync(
    'org.freedesktop.DBus',
    '/org/freedesktop/DBus',
    'org.freedesktop.DBus',
    'NameHasOwner',
    new GLib.Variant('(s)', ['sk.tito10047.respatch.Daemon']),
    null,
    Gio.DBusCallFlags.NONE,
    -1,
    null
);
print(hasOwner.get_child_value(0).get_boolean());
