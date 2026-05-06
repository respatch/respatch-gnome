import GObject from 'gi://GObject';
import { Project } from '../models/Project.js';
import { SettingsService } from '../services/SettingsService.js';

export const ProjectStore = GObject.registerClass({
    GTypeName: 'ProjectStore',
    Properties: {
        'active-project': GObject.ParamSpec.string(
            'active-project',
            'Active Project',
            'ID of the active project',
            GObject.ParamFlags.READWRITE,
            ''
        ),
    },
}, class ProjectStore extends GObject.Object {
    private _settingsService: SettingsService;

    constructor(settingsService: SettingsService) {
        super();
        this._settingsService = settingsService;
    }

    get active_project(): string {
        return this._settingsService.getActiveProject();
    }

    set active_project(value: string) {
        if (this.active_project !== value) {
            this._settingsService.setActiveProject(value);
            this.notify('active-project');
        }
    }

    getProjects(): Project[] {
        return this._settingsService.getProjects();
    }

    addProject(project: Project): void {
        this._settingsService.addProject(project);
    }

    updateProject(project: Project): void {
        this._settingsService.updateProject(project);
    }

    removeProject(id: string): void {
        this._settingsService.removeProject(id);
        if (this.active_project === id) {
            const projects = this.getProjects();
            if (projects.length > 0) {
                this.setActiveProject(projects[0].id);
            } else {
                this.setActiveProject('');
            }
        }
    }

    getActiveProject(): Project | null {
        const id = this.active_project;
        if (!id) return null;
        return this.getProjects().find(p => p.id === id) || null;
    }

    setActiveProject(id: string): void {
        this.active_project = id;
    }

    hasActiveProject(): boolean {
        const id = this.active_project;
        const projects = this.getProjects();
        return !!id && projects.some(p => p.id === id);
    }
});

export type ProjectStore = InstanceType<typeof ProjectStore>;
