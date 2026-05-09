import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetStrv = vi.fn();
const mockSetStrv = vi.fn();
const mockGetString = vi.fn();
const mockSetString = vi.fn();
const mockGetBoolean = vi.fn();
const mockSetBoolean = vi.fn();

vi.mock('gi://Gio', () => {
    return {
        default: {
            Settings: class {
                constructor() {}
                get_strv = mockGetStrv;
                set_strv = mockSetStrv;
                get_string = mockGetString;
                set_string = mockSetString;
                get_boolean = mockGetBoolean;
                set_boolean = mockSetBoolean;
            }
        }
    };
});

import { SettingsService } from '../src/services/SettingsService.js';

describe('SettingsService', () => {
    let service: SettingsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SettingsService();
    });

    it('should update project', () => {
        const existingProjects = [
            { id: '1', name: 'Old Name', url: '', token: '' },
            { id: '2', name: 'Other', url: '', token: '' }
        ];
        mockGetStrv.mockReturnValue(existingProjects.map(p => JSON.stringify(p)));
        
        const updatedProject = { id: '1', name: 'New Name', url: 'new-url', token: 'new-token' };
        service.updateProject(updatedProject);
        
        const expectedProjects = [
            updatedProject,
            existingProjects[1]
        ];
        expect(mockSetStrv).toHaveBeenCalledWith('projects', expectedProjects.map(p => JSON.stringify(p)));
    });

    it('should remove project', () => {
        const existingProjects = [
            { id: '1', name: 'P1', url: '', token: '' },
            { id: '2', name: 'P2', url: '', token: '' }
        ];
        mockGetStrv.mockReturnValue(existingProjects.map(p => JSON.stringify(p)));
        
        service.removeProject('1');
        
        const expectedProjects = [existingProjects[1]];
        expect(mockSetStrv).toHaveBeenCalledWith('projects', expectedProjects.map(p => JSON.stringify(p)));
    });

    it('should return settings instance', () => {
        const settings = service.getSettings();
        expect(settings).toBeDefined();
        expect(typeof (settings as any).get_strv).toBe('function');
    });

    it('should return active project', () => {
        mockGetString.mockReturnValue('123');
        const activeProjectId = service.getActiveProject();
        expect(activeProjectId).toBe('123');
        expect(mockGetString).toHaveBeenCalledWith('last-active-project');
    });
});