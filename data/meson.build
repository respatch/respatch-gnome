# Inštalácia ikony (SVG - scalable)
install_data('icons/hicolor/scalable/apps/sk.mostka.Respatch.svg',
  install_dir: get_option('datadir') / 'icons/hicolor/scalable/apps'
)

# Inštalácia PNG ikon (všetky veľkosti)
foreach size : ['16x16', '32x32', '48x48', '64x64', '128x128', '256x256', '512x512']
  install_data('icons/hicolor' / size / 'apps/sk.mostka.Respatch.png',
    install_dir: get_option('datadir') / 'icons/hicolor' / size / 'apps'
  )
endforeach

# Inštalácia schémy
install_data('sk.mostka.Respatch.gschema.xml',
  install_dir: get_option('datadir') / 'glib-2.0/schemas'
)

# Spustenie kompilácie schém po inštalácii
meson.add_install_script(
  'glib-compile-schemas',
  get_option('prefix') / get_option('datadir') / 'glib-2.0/schemas'
)

# Inštalácia AppStream metadát
install_data('sk.mostka.Respatch.metainfo.xml',
  install_dir: get_option('datadir') / 'metainfo'
)

# Inštalácia Desktop súboru (aby sa aplikácia objavila v menu)
install_data('sk.mostka.Respatch.desktop',
  install_dir: get_option('datadir') / 'applications'
)

# Daemon (ak má bežať na pozadí / autostart)
install_data('sk.mostka.Respatch.Daemon.desktop',
  install_dir: get_option('datadir') / 'applications'
)

# Inštalácia LICENSE súboru aplikácie
install_data('../LICENSE',
  install_dir: get_option('datadir') / 'licenses' / 'sk.mostka.Respatch' / 'respatch'
)
