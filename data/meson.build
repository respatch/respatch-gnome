# Inštalácia schémy
install_data('sk.tito10047.respatch.gschema.xml',
  install_dir: get_option('datadir') / 'glib-2.0/schemas'
)

# Spustenie kompilácie schém po inštalácii
# Použijeme join_paths, aby sme dostali absolútnu cestu /app/share/...
meson.add_install_script(
  'glib-compile-schemas',
  get_option('prefix') / get_option('datadir') / 'glib-2.0/schemas'
)

# Inštalácia AppStream metadát
install_data('sk.tito10047.respatch.metainfo.xml',
  install_dir: get_option('datadir') / 'metainfo'
)

# Inštalácia Desktop súboru (aby sa aplikácia objavila v menu)
install_data('sk.tito10047.respatch.desktop',
  install_dir: get_option('datadir') / 'applications'
)

# Daemon (ak má bežať na pozadí / autostart)
install_data('sk.tito10047.respatch.Daemon.desktop',
  install_dir: get_option('datadir') / 'applications'
)