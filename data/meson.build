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