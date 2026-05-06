export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
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
            const response = await fetch(endpoint, {
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
}
