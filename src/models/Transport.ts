export interface TransportInfo {
    failure: boolean;
    count: number | null;
    workers: number;
    usedWorkers: number;
    memory: string;
}

export type TransportsResponse = Record<string, TransportInfo>;
