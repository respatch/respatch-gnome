export interface RecentMessage {
    id: number;
    title: string;
    status: string | null;
    transport: string;
    duration: number;
    memory: string;
    handledAt: string;
}

export type RecentMessagesResponse = RecentMessage[];
