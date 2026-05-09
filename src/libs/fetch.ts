// @ts-ignore
import Soup from 'gi://Soup?version=3.0';
import GLib from 'gi://GLib';
import Gio from "gi://Gio";

/**
 * Minimal subset of the standard `fetch` API implemented on top of libsoup 3.
 * Supports: method, headers, body (string), status, ok, statusText, text(), json().
 */

type FetchOptions = {
    method?: string;
    body?: string;
    headers?: Record<string, string> | Array<[string, string]>;
};

interface IResponse {
    status: number;
    statusText: string;
    ok: boolean;
    url: string;
    headers: Record<string, string>;
    text(): Promise<string>;
    json(): Promise<unknown>;
}

class GjsResponse implements IResponse {
    status: number;
    statusText: string;
    ok: boolean;
    url: string;
    headers: Record<string, string>;
    private bodyBytes: Uint8Array;

    constructor(status: number, statusText: string, url: string, headers: Record<string, string>, bodyBytes: Uint8Array) {
        this.status = status;
        this.statusText = statusText;
        this.ok = status >= 200 && status < 300;
        this.url = url;
        this.headers = headers;
        this.bodyBytes = bodyBytes;
    }

    async text(): Promise<string> {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(this.bodyBytes);
    }

    async json(): Promise<unknown> {
        return JSON.parse(await this.text());
    }
}

function normalizeHeaders(input?: FetchOptions['headers']): Array<[string, string]> {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return Object.entries(input);
}

export const gjsFetch = (uri: string, options: FetchOptions = {}): Promise<IResponse> => {
    return new Promise((resolve, reject) => {
        try {
            const session = new Soup.Session({ user_agent: 'respatch/1.0 (gjs)' });

            const method = (options.method || 'GET').toUpperCase();
            const message = Soup.Message.new(method, uri);
            if (!message) {
                reject(new Error(`Invalid URI: ${uri}`));
                return;
            }

            for (const [key, value] of normalizeHeaders(options.headers)) {
                message.get_request_headers().append(key, value);
            }

            if (options.body !== undefined && options.body !== null) {
                const encoder = new TextEncoder();
                const bytes = encoder.encode(options.body);
                const glibBytes = new GLib.Bytes(bytes);
                message.set_request_body_from_bytes('application/octet-stream', glibBytes);
            }

            session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (sess: Soup.Session | null, result: Gio.AsyncResult) => {
                    try {
                        const s = sess ?? session;
                        const bytes = s.send_and_read_finish(result);
                        const status = message.status_code as number;
                        const reason = message.get_reason_phrase() || '';
                        const finalUri = message.get_uri();
                        const url = finalUri ? finalUri.to_string() : uri;

                        const headers: Record<string, string> = {};
                        message.get_response_headers().foreach((name: string, value: string) => {
                            headers[name.toLowerCase()] = value;
                        });

                        const data = bytes ? bytes.get_data() : null;
                        const u8 = data ? new Uint8Array(data) : new Uint8Array(0);

                        resolve(new GjsResponse(status, reason, url, headers, u8));
                    } catch (e) {
                        reject(e instanceof Error ? e : new Error(String(e)));
                    }
                },
            );
        } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
        }
    });
};

export type FetchFn = (uri: string, options?: FetchOptions) => Promise<IResponse>;
export type { IResponse, FetchOptions };
