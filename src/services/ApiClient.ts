import type { FetchFn } from '../libs/fetch.js';
import type { TransportsResponse } from '../models/Transport.js';

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
     * Verifies project by calling /status endpoint
     * @param url Project base URL
     * @param token API Token
     * @throws Error if verification fails
     */
    async verifyProject(url: string, token: string): Promise<void> {
        const endpoint = url.replace(/\/+$/, '') + '/status';

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
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(String(error));
        }
    }

    async fetchTransports(url: string, token: string): Promise<TransportsResponse> {
        const endpoint = url.replace(/\/+$/, '') + '/transport';

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

            return await response.json() as TransportsResponse;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(String(error));
        }
    }
}
