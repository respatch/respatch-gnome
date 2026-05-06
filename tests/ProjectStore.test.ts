import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock GObject
vi.mock('gi://GObject', () => {
    return {
        default: {
            Object: class {
                _init() {}
                notify() {}
            },
            registerClass: (config: any, klass: any) => {
                return klass;
            },
            ParamSpec: {
                string: vi.fn().mockReturnValue({}),
            },
            ParamFlags: {
                READWRITE: 1,
            },
        }
    };
});

// Mock Gio
vi.mock('gi://Gio', () => ({
    default: {
        Settings: class {}
    }
}));

const mockSettingsService = {
    getActiveProject: vi.fn(),
    setActiveProject: vi.fn(),
    getProjects: vi.fn(),
    addProject: vi.fn(),
};

// We need to import ProjectStore AFTER mocking
import { ProjectStore } from '../src/stores/ProjectStore.js';

describe('ProjectStore', () => {
    let store: any;

    beforeEach(() => {
        vi.clearAllMocks();
        store = new ProjectStore(mockSettingsService as any);
    });

    it('should get projects from settings service', () => {
        const projects = [{ id: '1', name: 'Test', url: '', token: '' }];
        mockSettingsService.getProjects.mockReturnValue(projects);
        
        expect(store.getProjects()).toEqual(projects);
        expect(mockSettingsService.getProjects).toHaveBeenCalled();
    });

    it('should add project via settings service', () => {
        const project = { id: '1', name: 'Test', url: '', token: '' };
        store.addProject(project);
        expect(mockSettingsService.addProject).toHaveBeenCalledWith(project);
    });

    it('should correctly report if active project exists', () => {
        mockSettingsService.getActiveProject.mockReturnValue('1');
        mockSettingsService.getProjects.mockReturnValue([{ id: '1' }]);
        expect(store.hasActiveProject()).toBe(true);
        
        mockSettingsService.getProjects.mockReturnValue([{ id: '2' }]);
        expect(store.hasActiveProject()).toBe(false);

        mockSettingsService.getActiveProject.mockReturnValue('');
        expect(store.hasActiveProject()).toBe(false);
    });

    it('should set active project and call notify', () => {
        const notifySpy = vi.spyOn(store, 'notify');
        mockSettingsService.getActiveProject.mockReturnValue('old');
        
        store.active_project = 'new';
        
        expect(mockSettingsService.setActiveProject).toHaveBeenCalledWith('new');
        expect(notifySpy).toHaveBeenCalledWith('active-project');
    });

    it('should not notify if active project is same', () => {
        const notifySpy = vi.spyOn(store, 'notify');
        mockSettingsService.getActiveProject.mockReturnValue('same');
        
        store.active_project = 'same';
        
        expect(notifySpy).not.toHaveBeenCalled();
    });

    it('should get active project object', () => {
        const project = { id: '1', name: 'Test' };
        mockSettingsService.getActiveProject.mockReturnValue('1');
        mockSettingsService.getProjects.mockReturnValue([project]);
        
        expect(store.getActiveProject()).toEqual(project);
    });
});
