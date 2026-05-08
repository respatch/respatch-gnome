import { describe, it, expect } from 'vitest';
import { formatDuration } from '../src/utils/format';

describe('formatDuration', () => {
    it('formats milliseconds under 10 with one decimal place', () => {
        expect(formatDuration(5)).toBe('5.0 ms');
        expect(formatDuration(0.5)).toBe('0.5 ms');
    });

    it('formats milliseconds over 10 without decimal places', () => {
        expect(formatDuration(10)).toBe('10 ms');
        expect(formatDuration(500)).toBe('500 ms');
        expect(formatDuration(999)).toBe('999 ms');
    });

    it('formats seconds with two decimal places', () => {
        expect(formatDuration(1000)).toBe('1.00 s');
        expect(formatDuration(1234)).toBe('1.23 s');
        expect(formatDuration(60000)).toBe('60.00 s');
    });

    it('handles zero', () => {
        expect(formatDuration(0)).toBe('0.0 ms');
    });
});
