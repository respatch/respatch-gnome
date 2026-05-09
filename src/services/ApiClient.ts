import type { FetchFn } from '../libs/fetch.js';
import type { TransportsResponse } from '../models/Transport.js';
import type { RecentMessagesResponse } from '../models/RecentMessage.js';
import type { FailedMessagesResponse } from '../models/FailedMessage.js';
import type { ApiResponse } from '../models/ApiResponse.js';

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
     * Performs an authenticated POST request and returns the parsed JSON response.
     */
    private async postJson<T>(url: string, token: string, path: string, actionToken: string, body?: any): Promise<T> {
        const suffix = '_token='+encodeURIComponent(actionToken);
        if (path.indexOf('?') === -1) {
            path += '?' + suffix;
        }else{
            path += '&' + suffix;
        }

        const endpoint = url.replace(/\/+$/, '') + path;

        console.log('POST', endpoint, body);

        try {
            const response = await this.fetchFn(endpoint, {
                method: 'POST',
                headers: {
                    'X-Respatch-Token': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (response.status === 204) {
                return { success: true, message: 'OK' } as unknown as T;
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = data.message || `Chyba ${response.status}`;
                const error = new Error(errorMsg);
                (error as any).data = data;
                throw error;
            }

            return data as T;
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
        return this.getJson<TransportsResponse>(url, token, '/transports');
    }

    async fetchRecentMessages(url: string, token: string): Promise<RecentMessagesResponse> {
        return this.getJson<RecentMessagesResponse>(url, token, '/recent-messages');
    }

    async fetchFailedMessages(url: string, token: string, transportName: string, limit = 50): Promise<FailedMessagesResponse> {
        return this.getJson<FailedMessagesResponse>(url, token, `/transport/${encodeURIComponent(transportName)}?limit=${limit}`);
    }

    async removeFailedMessage(url: string, token: string, transport: string, id: number, csrfToken: string): Promise<ApiResponse> {
        return this.postJson<ApiResponse>(url, token, `/transport/${transport}/${id}/remove`,csrfToken);
    }

    async retryFailedMessage(url: string, token: string, transport: string, id: number, csrfToken: string): Promise<ApiResponse> {
        return this.postJson<ApiResponse>(url, token, `/transport/${transport}/${id}/retry`, csrfToken);
    }
}
