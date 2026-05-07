export interface RecentMessage {
    id: number;
    status: string | null;
    transport: string;
    duration: number;
    memory: string;
    handledAt: string;
}

export type RecentMessagesResponse = RecentMessage[];
