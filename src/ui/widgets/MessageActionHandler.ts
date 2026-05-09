import Adw from 'gi://Adw?version=1';
import { _ } from '../../gettext.js';
import type { ApiClient } from '../../services/ApiClient.js';
import type { LoggerService } from '../../services/LoggerService.js';
import type { FailedMessage } from '../../models/FailedMessage.js';
import type { FailedMessageActionHandler } from './FailedMessageRow.js';

export interface ProjectContext {
    url: string;
    token: string;
}

export interface MessageActionHandlerDeps {
    apiClient: ApiClient;
    logger: LoggerService;
    toastOverlay: Adw.ToastOverlay;
    /** Resolves the active project context at the time of the action. */
    getProject: () => ProjectContext | null;
    /** Called after a successful action so the caller can remove the row. */
    onSuccess: (messageId: string) => void;
}

/**
 * Handles delete / retry actions for a failed message.
 *
 * Encapsulates all API calls, error handling, toast notifications and
 * post-action cleanup so that neither MainWindow nor FailedMessageRow
 * need to contain this logic.
 *
 * Can be reused anywhere a {@link FailedMessageActionHandler} callback is needed.
 */
export class MessageActionHandler {
    constructor(private readonly deps: MessageActionHandlerDeps) {}

    /** Returns a callback compatible with {@link FailedMessageActionHandler}. */
    createHandler(): FailedMessageActionHandler {
        return async (message: FailedMessage, action: 'retry' | 'delete') => {
            const project = this.deps.getProject();
            if (!project) return;

            try {
                let response;
                if (action === 'delete') {
                    response = await this.deps.apiClient.removeFailedMessage(
                        project.url,
                        project.token,
                        message.transport,
                        message.id,
                        message.deleteToken
                    );
                } else {
                    response = await this.deps.apiClient.retryFailedMessage(
                        project.url,
                        project.token,
                        message.transport,
                        message.id,
                        message.retryToken
                    );
                }

                const title = response.message
                    || (action === 'delete'
                        ? _('Správa bola vymazaná')
                        : _('Pokus o opätovné odoslanie bol úspešný'));

                this.deps.toastOverlay.add_toast(new Adw.Toast({ title }));
                this.deps.onSuccess(String(message.id));

            } catch (err) {
                this.deps.logger.error(
                    `Akcia ${action} zlyhala pre správu #${message.id}: ${err}`
                );

                if (err instanceof Error && (err as any).data?.exception) {
                    const ex = (err as any).data.exception;
                    this.deps.logger.error(
                        `Server exception: ${ex.class}: ${ex.message} in ${ex.file}:${ex.line}`
                    );
                }

                const errorMsg = err instanceof Error ? err.message : String(err);
                this.deps.toastOverlay.add_toast(
                    new Adw.Toast({ title: _('Akcia zlyhala: ') + errorMsg })
                );
            }
        };
    }
}
