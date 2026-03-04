import { describe, expect, it } from 'vitest';
import { buildOccupationCanonicalKey, compileOccupationRowsFromFiles } from './occupation-csv';

describe('occupation-csv', () => {
    it('normaliza correctamente la canonical key', () => {
        const key = buildOccupationCanonicalKey({
            dataSource: ' EU_Forecast ',
            geography: 'España',
            industryCode: null,
            occupationCode: ' 11-1011 ',
            occupationTitle: 'Data Scientists',
            occupationType: ' Summary ',
            qualificationLevel: ' Total '
        });

        expect(key).toBe('eu_forecast|espana||11-1011|data scientists|summary|total');
    });

    it('compila fuentes UE y US con escala unificada en miles', async () => {
        const eu = [
            'country;occupation;qualification;2024;2034',
            'España;Data Scientists;Alta;1.234;1.999'
        ].join('\n');

        const us = [
            '| Occupation Code | Occupation Title | Occupation Type | 2024 Employment | 2024 Percent of Industry | 2024 Percent of Occupation | Projected 2034 Employment | Projected 2034 Percent of Industry | Projected 2034 Percent of Occupation |',
            '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
            '| =\"15-2051\" | Data Scientists | Detailed | 75.4 | 3.2 | 100.0 | 112.7 | 3.6 | 100.0 |'
        ].join('\n');

        const result = await compileOccupationRowsFromFiles([
            { name: 'Employment_occupation_test.csv', content: eu },
            { name: 'National Employment Matrix_IND_541500.csv', content: us }
        ]);

        expect(result.rows.length).toBe(4);

        const eu2034 = result.rows.find(
            (row) => row.dataSource === 'EU_Forecast' && row.geography === 'España' && row.year === 2034
        );
        expect(eu2034).toBeDefined();
        expect(eu2034?.employmentCount).toBe(1.999);

        const us2024 = result.rows.find(
            (row) => row.dataSource === 'US_BLS_Matrix' && row.year === 2024
        );
        expect(us2024).toBeDefined();
        expect(us2024?.occupationCode).toBe('15-2051');
        expect(us2024?.industryCode).toBe('541500');
        expect(us2024?.employmentCount).toBe(75.4);
    });
});
