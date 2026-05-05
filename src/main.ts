import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { SettingsService } from './services/SettingsService.js';
import { _ } from './gettext.js';
import { fetch } from './libs/fetch.js';

const app = new Adw.Application({
    application_id: 'sk.dsidata.respatch',
    flags: Gio.ApplicationFlags.FLAGS_NONE,
});

app.connect('activate', () => {
    const file = Gio.File.new_for_uri(import.meta.url);
    const dir = file.get_parent()?.get_path();

    const settingsService = new SettingsService();

    function showMainWindow() {
        const uiPath = dir + '/ui/main.ui';
        const builder = new Gtk.Builder();
        builder.add_from_file(uiPath);
        
        const mainWindow = builder.get_object('window') as Adw.ApplicationWindow;
        mainWindow.set_application(app);
        mainWindow.present();
    }

    function showWelcomeWindow() {
        const uiPath = dir + '/ui/window.ui';
        const builder = new Gtk.Builder();
        builder.add_from_file(uiPath);
        
        const welcomeWindow = builder.get_object('window') as Adw.ApplicationWindow;
        welcomeWindow.set_application(app);
        
        const addProjectBtn = builder.get_object('add_project_button') as Gtk.Button;
        if (addProjectBtn) {
            addProjectBtn.connect('clicked', () => {
                const dialogBuilder = new Gtk.Builder();
                dialogBuilder.add_from_file(dir + '/ui/add_project_dialog.ui');
                
                const dialog = dialogBuilder.get_object('add_project_dialog') as Adw.Window;
                dialog.set_transient_for(welcomeWindow);
                
                const cancelBtn = dialogBuilder.get_object('cancel_button') as Gtk.Button;
                const actionBtn = dialogBuilder.get_object('action_button') as Gtk.Button;
                
                const nameInput = dialogBuilder.get_object('name_input') as Adw.EntryRow;
                const urlInput = dialogBuilder.get_object('url_input') as Adw.EntryRow;
                const tokenInput = dialogBuilder.get_object('token_input') as Adw.PasswordEntryRow;
                const toastOverlay = dialogBuilder.get_object('toast_overlay') as Adw.ToastOverlay;
                
                cancelBtn.connect('clicked', () => {
                    dialog.close();
                });
                
                let dialogState: 'verify' | 'add' | 'error' = 'verify';

                const resetState = () => {
                    if (dialogState !== 'verify') {
                        dialogState = 'verify';
                        actionBtn.set_label(_('Overiť'));
                        actionBtn.remove_css_class('success');
                        actionBtn.remove_css_class('destructive-action');
                        actionBtn.add_css_class('suggested-action');
                    }
                };

                nameInput.connect('notify::text', resetState);
                urlInput.connect('notify::text', resetState);
                tokenInput.connect('notify::text', resetState);
                
                actionBtn.connect('clicked', async () => {
                    const name = nameInput.get_text();
                    const url = urlInput.get_text();
                    const token = tokenInput.get_text();
                    
                    if (!name || !url || !token) return;
                    
                    if (dialogState === 'verify' || dialogState === 'error') {
                        actionBtn.set_sensitive(false);
                        actionBtn.set_label(_('Overovanie...'));
                        
                        try {
                            const endpoint = url.replace(/\/+$/, '') + '/status';
                            const response = await fetch(endpoint, {
                                method: 'GET',
                                headers: {
                                    'X-Respatch-Token': token,
                                    'Accept': 'application/json'
                                }
                            });
                            
                            if (response.ok) {
                                dialogState = 'add';
                                actionBtn.set_label(_('Uložiť'));
                                actionBtn.remove_css_class('suggested-action');
                                actionBtn.remove_css_class('destructive-action');
                                actionBtn.add_css_class('success');
                            } else {
                                throw new Error(`Chyba ${response.status}`);
                            }
                        } catch (error) {
                            dialogState = 'error';
                            actionBtn.set_label(_('Skúsiť znova'));
                            actionBtn.remove_css_class('suggested-action');
                            actionBtn.remove_css_class('success');
                            actionBtn.add_css_class('destructive-action');
                            
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            const toast = new Adw.Toast({ title: _('Nepodarilo sa overiť: ') + errorMessage });
                            toastOverlay.add_toast(toast);
                        } finally {
                            actionBtn.set_sensitive(true);
                        }
                    } else if (dialogState === 'add') {
                        const project = { id: GLib.uuid_string_random(), name, url, token };
                        
                        settingsService.addProject(project);
                        settingsService.setActiveProject(project.id);
                        
                        dialog.close();
                        showMainWindow();
                        welcomeWindow.close();
                    }
                });
                
                dialog.present();
            });
        }
        
        welcomeWindow.present();
    }

    const activeProjectId = settingsService.getActiveProject();
    const projects = settingsService.getProjects();
    
    const activeProjectExists = activeProjectId && projects.some(p => p.id === activeProjectId || p.name === activeProjectId);
    
    if (activeProjectExists) {
        showMainWindow();
    } else {
        showWelcomeWindow();
    }
});

app.run([import.meta.url]);
