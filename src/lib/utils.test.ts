import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('should merge tailwind classes correctly', () => {
        const result = cn('px-2 py-2', 'px-4');
        expect(result).toBe('py-2 px-4'); // tailwind-merge should favor the last one
    });

    it('should handle conditional classes', () => {
        const result = cn('base', true && 'active', false && 'hidden');
        expect(result).toContain('base');
        expect(result).toContain('active');
        expect(result).not.toContain('hidden');
    });
});
