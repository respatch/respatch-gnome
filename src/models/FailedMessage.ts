export interface FailedMessageException {
    class: string;
    description: string;
    name: string;
}

export interface FailedMessage {
    id: number;
    title: string;
    dispatched: string;
    deleteToken: string;
    retryToken: string;
    exception: FailedMessageException | null;
}

export type FailedMessagesResponse = FailedMessage[];