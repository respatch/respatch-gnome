project('respatch', 'c',
          version: '1.0.0',
    meson_version: '>= 0.62.0',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

i18n = import('i18n')
gnome = import('gnome')
fs = import('fs')

# Definícia ciest, ktoré predtým chýbali
pkgdatadir = get_option('datadir') / meson.project_name()
moduledir = pkgdatadir / 'src'

subdir('data')

blueprint_compiler = find_program('blueprint-compiler')

blueprints = files(
  'src/ui/add_project_dialog.blp',
  'src/ui/failed_message_row.blp',
  'src/ui/failed_transport_row.blp',
  'src/ui/main.blp',
  'src/ui/manage_servers.blp',
  'src/ui/recent_message_row.blp',
  'src/ui/settings.blp',
  'src/ui/transport_row.blp',
  'src/ui/window.blp',
)

blueprint_targets = []
foreach blp : blueprints
  blp_name = fs.stem(blp)
  ui_target = custom_target(blp_name + '-ui',
    input: blp,
    output: blp_name + '.ui',
    command: [blueprint_compiler, 'compile', '--output', '@OUTPUT@', '@INPUT@'],
    install: true,
    install_dir: get_option('datadir') / 'respatch' / 'src' / 'ui',
    install_tag: 'runtime',
  )
  blueprint_targets += ui_target
endforeach

compiled_blueprints = blueprint_targets

esbuild = find_program('esbuild')

main_js = custom_target('main-js',
  input: 'src/main.ts',
  output: 'main.mjs',
  command: [
    esbuild,
    '@INPUT@',
    '--bundle',
    '--format=esm',
    '--outfile=@OUTPUT@',
    '--external:gi://*',
    '--external:gettext'
  ],
  install: true,
  install_dir: moduledir
)

daemon_js = custom_target('daemon-js',
  input: 'src/daemon.ts',
  output: 'daemon.mjs',
  command: [
    esbuild,
    '@INPUT@',
    '--bundle',
    '--format=esm',
    '--outfile=@OUTPUT@',
    '--external:gi://*',
    '--external:gettext'
  ],
  install: true,
  install_dir: moduledir
)

gnome.compile_resources('respatch',
  'data/respatch.gresource.xml',
  source_dir: [
    meson.current_build_dir(), # Pre vygenerované .ui súbory z blueprintov
    meson.current_source_dir() / 'src', # Pre statické .css súbory
  ],
  dependencies: compiled_blueprints,
  c_name: 'respatch'
)


# Inštalácia statického CSS súboru
install_data('src/ui/style.css',
  install_dir: get_option('datadir') / 'respatch' / 'src' / 'ui'
)

# Inštalácia spúšťacieho skriptu s explicitnými právami (rwxr-xr-x)
install_data('src/respatch.sh',
  rename: 'respatch',
  install_dir: get_option('bindir'),
  install_mode: 'rwxr-xr-x'
)