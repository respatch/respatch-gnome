export interface ApiResponse {
    success: boolean;
    message: string;
    exception?: {
        class: string;
        message: string;
        code: number;
        file: string;
        line: number;
        trace: any[];
    };
}
