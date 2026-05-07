export interface TransportInfo {
    count: number | null;
    workers: number;
    usedWorkers: number;
    memory: string;
}

export type TransportsResponse = Record<string, TransportInfo>;
