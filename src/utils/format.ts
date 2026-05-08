/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param durationMs Duration in milliseconds
 * @returns Formatted string (e.g. "5.0 ms", "500 ms", "1.23 s")
 */
export function formatDuration(durationMs: number): string {
    if (durationMs < 1000) {
        return `${durationMs.toFixed(durationMs < 10 ? 1 : 0)} ms`;
    }
    return `${(durationMs / 1000).toFixed(2)} s`;
}
