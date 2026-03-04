import { describe, expect, it } from 'vitest';
import {
    buildBlsOeNationalEmploymentSeriesId,
    extractSocCodeFromBlsOeSeriesId,
    formatSocCode
} from './bls';

describe('bls', () => {
    it('construye series ID nacional OE de empleo desde código SOC', () => {
        expect(buildBlsOeNationalEmploymentSeriesId('11-3012')).toBe('OEUN000000000000011301201');
        expect(buildBlsOeNationalEmploymentSeriesId('113012')).toBe('OEUN000000000000011301201');
    });

    it('extrae código SOC desde series ID OE nacional de empleo', () => {
        expect(extractSocCodeFromBlsOeSeriesId('OEUN000000000000011301201')).toBe('113012');
        expect(extractSocCodeFromBlsOeSeriesId('OEUS480000000000011301201')).toBe('113012');
        expect(extractSocCodeFromBlsOeSeriesId('OEUN000000000000011301204')).toBeNull();
    });

    it('normaliza formato visual de código SOC', () => {
        expect(formatSocCode('113012')).toBe('11-3012');
        expect(formatSocCode('11-3012')).toBe('11-3012');
    });
});
