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

    public getActiveProject(): string {
        return this.settings.get_string('last-active-project');
    }

    public setActiveProject(projectId: string): void {
        this.settings.set_string('last-active-project', projectId);
    }
}
