import type { FetchFn } from '../libs/fetch.js';
import type { TransportsResponse } from '../models/Transport.js';
import type { RecentMessagesResponse } from '../models/RecentMessage.js';

/**
 * Generic fetch-like signature accepted by ApiClient.
 * Both the standard browser/Vitest `fetch` and our GJS Soup-based wrapper
 * (`gjsFetch` from src/libs/fetch.ts) satisfy this contract for our usage.
 */
export type ApiFetch = FetchFn | typeof fetch;

export class ApiClient {
    private baseUrl: string;
    private fetchFn: ApiFetch;

    /**
     * @param fetchFn fetch implementation (real `fetch` for tests/Node, `gjsFetch` for GJS runtime)
     * @param baseUrl optional base URL prefix
     */
    constructor(fetchFn: ApiFetch, baseUrl: string = '') {
        if (typeof fetchFn !== 'function') {
            throw new Error('ApiClient requires a fetch function');
        }
        this.fetchFn = fetchFn;
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }

    /**
     * Performs an authenticated GET request to a project endpoint and returns the parsed JSON response.
     * @param url Project base URL
     * @param token API token
     * @param path Endpoint path (must start with `/`)
     */
    private async getJson<T>(url: string, token: string, path: string): Promise<T> {
        const endpoint = url.replace(/\/+$/, '') + path;

        try {
            const response = await this.fetchFn(endpoint, {
                method: 'GET',
                headers: {
                    'X-Respatch-Token': token,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Chyba ${response.status}`);
            }

            return await response.json() as T;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(String(error));
        }
    }

    /**
     * Verifies project by calling /status endpoint
     * @param url Project base URL
     * @param token API Token
     * @throws Error if verification fails
     */
    async verifyProject(url: string, token: string): Promise<void> {
        await this.getJson<unknown>(url, token, '/status');
    }

    async fetchTransports(url: string, token: string): Promise<TransportsResponse> {
        return this.getJson<TransportsResponse>(url, token, '/transport');
    }

    async fetchRecentMessages(url: string, token: string): Promise<RecentMessagesResponse> {
        return this.getJson<RecentMessagesResponse>(url, token, '/recent-messages');
    }
}
