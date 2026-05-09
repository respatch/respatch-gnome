import Gio from 'gi://Gio';
import { Project } from '../models/Project.js';

export class SettingsService {
    private settings: Gio.Settings;

    constructor() {
        this.settings = new Gio.Settings({ schema_id: 'org.respatch' });
    }

    public getProjects(): Project[] {
        const projectsStr = this.settings.get_strv('projects');
        return projectsStr.map(str => JSON.parse(str) as Project);
    }

    public addProject(project: Project): void {
        const projects = this.getProjects();
        projects.push(project);
        const projectsStr = projects.map(p => JSON.stringify(p));
        this.settings.set_strv('projects', projectsStr);
    }

    public updateProject(project: Project): void {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
            projects[index] = project;
            const projectsStr = projects.map(p => JSON.stringify(p));
            this.settings.set_strv('projects', projectsStr);
        }
    }

    public removeProject(id: string): void {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        const projectsStr = filtered.map(p => JSON.stringify(p));
        this.settings.set_strv('projects', projectsStr);
    }

    public getActiveProject(): string {
        return this.settings.get_string('last-active-project');
    }

    public setActiveProject(projectId: string): void {
        this.settings.set_string('last-active-project', projectId);
    }

    public getLoggingEnabled(): boolean {
        return this.settings.get_boolean('logging-enabled');
    }

    public setLoggingEnabled(enabled: boolean): void {
        this.settings.set_boolean('logging-enabled', enabled);
    }

    public getLogToFile(): boolean {
        return this.settings.get_boolean('log-to-file');
    }

    public setLogToFile(enabled: boolean): void {
        this.settings.set_boolean('log-to-file', enabled);
    }

    public getMessengerDashboardUrl(): string {
        return this.settings.get_string('messenger-dashboard-url');
    }

    public setMessengerDashboardUrl(url: string): void {
        this.settings.set_string('messenger-dashboard-url', url);
    }

    public getPreferredBrowser(): string {
        return this.settings.get_string('preferred-browser');
    }

    public setPreferredBrowser(browser: string): void {
        this.settings.set_string('preferred-browser', browser);
    }
}
