import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogTransport {
    write(level: LogLevel, message: string, context?: object): void;
}

export class ConsoleTransport implements LogTransport {
    write(level: LogLevel, message: string, context?: object): void {
        const timestamp = new Date().toISOString();
        const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
        const logMsg = `[${level.toUpperCase()}] ${timestamp} ${message}${ctxStr}`;

        switch (level) {
            case 'debug':
            case 'info':
                console.log(logMsg);
                break;
            case 'warn':
                console.warn(logMsg);
                break;
            case 'error':
                console.error(logMsg);
                break;
        }
    }
}

export class FileTransport implements LogTransport {
    private logFile: Gio.File;

    constructor(logPath: string) {
        this.logFile = Gio.File.new_for_path(logPath);
    }

    write(level: LogLevel, message: string, context?: object): void {
        const timestamp = new Date().toISOString();
        const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
        const logMsg = `[${level.toUpperCase()}] ${timestamp} ${message}${ctxStr}\n`;

        try {
            const parent = this.logFile.get_parent();
            if (parent && !parent.query_exists(null)) {
                parent.make_directory_with_parents(null);
            }

            const stream = this.logFile.append_to(Gio.FileCreateFlags.NONE, null);
            // In GJS, write_all returns [bytes_written, actual_bytes_written]
            stream.write_all(logMsg, null);
            stream.close(null);
        } catch (error) {
            // Fallback to console if file logging fails
            console.error(`Failed to write to log file: ${error}`);
        }
    }
}

export class LoggerService {
    constructor(private transports: LogTransport[], private enabled: boolean = true) {}

    debug(message: string, context?: object): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: object): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: object): void {
        this.log('warn', message, context);
    }

    error(message: string, context?: object): void {
        this.log('error', message, context);
    }

    private log(level: LogLevel, message: string, context?: object): void {
        if (!this.enabled) return;
        for (const transport of this.transports) {
            try {
                transport.write(level, message, context);
            } catch (e) {
                // Ignore transport errors
            }
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
}
