import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import type { SettingsService } from './SettingsService.js';
import type { Project } from '../models/Project.js';

/**
 * Centralized service for building application URLs and opening them in a browser.
 *
 * All URL construction logic lives here so that individual widgets and rows
 * do not need to know about URL patterns or the preferred-browser setting.
 */
export class BrowserService {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly getActiveProject: () => Project | null,
    ) {}

    // -------------------------------------------------------------------------
    // URL builders
    // -------------------------------------------------------------------------

    /** Base URL of the Symfony Messenger dashboard (without trailing slash). */
    getMessengerBaseUrl(): string {
        const custom = this.settingsService.getMessengerDashboardUrl().trim();
        if (custom) return custom.replace(/\/$/, '');

        const p = this.getActiveProject();
        if (!p) return '';
        return `${p.url.replace(/\/_respatch\/api\/?$/, '')}/admin/messenger`;
    }

    /** URL for a specific transport detail page. */
    getTransportUrl(transportName: string): string {
        return `${this.getMessengerBaseUrl()}/transport/${transportName}`;
    }

    /** URL for the failed-messages history page. */
    getFailedMessagesUrl(): string {
        return `${this.getMessengerBaseUrl()}/history?status=failed`;
    }

    /** URL for the recent-messages history page. */
    getRecentMessagesUrl(): string {
        return `${this.getMessengerBaseUrl()}/history`;
    }

    /** URL for filtering history by message class/type. */
    getMessageTypeUrl(messageClass: string): string {
        return `${this.getMessengerBaseUrl()}/history?type=${encodeURIComponent(messageClass)}`;
    }

    // -------------------------------------------------------------------------
    // Browser launcher
    // -------------------------------------------------------------------------

    /**
     * Opens `url` in the preferred browser (from settings) or falls back to
     * the system default via `Gio.AppInfo.launch_default_for_uri`.
     */
    openUrl(url: string): void {
        const browser = this.settingsService.getPreferredBrowser().trim();
        if (browser) {
            try {
                GLib.spawn_command_line_async(`${browser} ${url}`);
                return;
            } catch {
                // fall through to system default
            }
        }
        try {
            Gio.AppInfo.launch_default_for_uri(url, null);
        } catch {
            // nothing we can do
        }
    }
}
