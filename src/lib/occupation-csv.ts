import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

export type CompiledOccupationRow = {
    dataSource: string;
    geography: string;
    industryCode: string | null;
    occupationCode: string | null;
    occupationTitle: string;
    occupationType: string;
    qualificationLevel: string;
    year: number;
    employmentCount: number;
    percentOfIndustry: number | null;
    percentOfOccupation: number | null;
};

type InMemoryCsvFile = {
    name: string;
    content: string;
};

type CompileResult = {
    rows: CompiledOccupationRow[];
    usedPythonCompiler: boolean;
    compilerMessage: string;
};

type CsvRecord = Record<string, string>;

const EU_FILE_PREFIX = 'Employment_occupation';
const US_FILE_PREFIX = 'National Employment Matrix_IND_';

function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._ -]/g, '_');
}

function normalizeText(value: string | null | undefined): string {
    return (value || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

export function buildOccupationCanonicalKey(input: {
    dataSource: string;
    geography: string;
    industryCode: string | null;
    occupationCode: string | null;
    occupationTitle: string;
    occupationType: string;
    qualificationLevel: string;
}): string {
    return [
        normalizeText(input.dataSource),
        normalizeText(input.geography),
        normalizeText(input.industryCode),
        normalizeText(input.occupationCode),
        normalizeText(input.occupationTitle),
        normalizeText(input.occupationType),
        normalizeText(input.qualificationLevel)
    ].join('|');
}

function parseDelimited(content: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    const pushCell = () => {
        currentRow.push(currentCell);
        currentCell = '';
    };

    const pushRow = () => {
        // Drop trailing empty rows.
        if (currentRow.length === 1 && currentRow[0] === '') {
            currentRow = [];
            return;
        }
        rows.push(currentRow);
        currentRow = [];
    };

    for (let i = 0; i < content.length; i += 1) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === delimiter) {
            pushCell();
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && nextChar === '\n') {
                i += 1;
            }
            pushCell();
            pushRow();
            continue;
        }

        currentCell += char;
    }

    pushCell();
    if (currentRow.length > 0) {
        pushRow();
    }

    return rows;
}

function rowsToRecords(rows: string[][]): CsvRecord[] {
    if (rows.length === 0) return [];
    const header = rows[0].map((cell) => cell.trim());
    return rows
        .slice(1)
        .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
        .map((row) => {
            const record: CsvRecord = {};
            header.forEach((key, index) => {
                record[key] = String(row[index] ?? '').trim();
            });
            return record;
        });
}

function toNumber(raw: string | null | undefined): number | null {
    const value = String(raw ?? '').trim();
    if (!value) return null;
    const numeric = Number(value.replace(/,/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
}

function toEuNumber(raw: string | null | undefined): number | null {
    const value = String(raw ?? '').trim();
    if (!value) return null;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
}

function trimOrNull(raw: string | null | undefined): string | null {
    const value = String(raw ?? '').trim();
    return value ? value : null;
}

function parseCompiledCsv(content: string): CompiledOccupationRow[] {
    const records = rowsToRecords(parseDelimited(content, ','));
    const rows: CompiledOccupationRow[] = [];

    for (const record of records) {
        const year = Number(record.Year);
        const employmentCount = toNumber(record.Employment_Count);
        const occupationTitle = (record.Occupation_Title || '').trim();
        const geography = (record.Geography || '').trim();
        const dataSource = (record.Data_Source || '').trim();

        if (!occupationTitle || !geography || !dataSource || !Number.isFinite(year) || employmentCount === null) {
            continue;
        }

        rows.push({
            dataSource,
            geography,
            industryCode: trimOrNull(record.Industry_Code),
            occupationCode: trimOrNull(record.Occupation_Code),
            occupationTitle,
            occupationType: trimOrNull(record.Occupation_Type) || 'Summary',
            qualificationLevel: trimOrNull(record.Qualification_Level) || 'Total',
            year,
            employmentCount,
            percentOfIndustry: toNumber(record.Percent_of_Industry),
            percentOfOccupation: toNumber(record.Percent_of_Occupation)
        });
    }

    return rows;
}

function parseEuFileFallback(file: InMemoryCsvFile): CompiledOccupationRow[] {
    const records = rowsToRecords(parseDelimited(file.content, ';'));
    if (records.length === 0) return [];

    const yearColumns = Object.keys(records[0]).filter((column) => column.startsWith('20'));
    const rows: CompiledOccupationRow[] = [];

    for (const record of records) {
        const geography = (record.country || '').trim();
        const occupationTitle = (record.occupation || '').trim();
        const qualificationLevel = trimOrNull(record.qualification) || 'Total';
        if (!geography || !occupationTitle) continue;

        for (const yearColumn of yearColumns) {
            const year = Number(yearColumn);
            if (!Number.isFinite(year)) continue;

            const rawEmployment = toEuNumber(record[yearColumn]);
            if (rawEmployment === null) continue;

            rows.push({
                dataSource: 'EU_Forecast',
                geography,
                industryCode: null,
                occupationCode: null,
                occupationTitle,
                occupationType: 'Summary',
                qualificationLevel,
                year,
                employmentCount: rawEmployment / 1000,
                percentOfIndustry: null,
                percentOfOccupation: null
            });
        }
    }

    return rows;
}

function hasRequiredUsColumns(records: CsvRecord[]): boolean {
    if (records.length === 0) return false;
    const sample = records[0];
    const required = [
        'Occupation Code',
        'Occupation Title',
        'Occupation Type',
        '2024 Employment',
        'Projected 2034 Employment'
    ];
    return required.every((column) => Object.prototype.hasOwnProperty.call(sample, column));
}

function parseUsMarkdownRecords(content: string): CsvRecord[] {
    const rows = parseDelimited(content, '|')
        .map((row) => row.map((cell) => cell.trim()))
        .map((row) => {
            let normalized = [...row];
            if (normalized.length > 0 && normalized[0] === '') normalized = normalized.slice(1);
            if (normalized.length > 0 && normalized[normalized.length - 1] === '') normalized = normalized.slice(0, -1);
            return normalized;
        })
        .filter((row) => row.some((cell) => cell !== ''));

    if (rows.length === 0) return [];
    return rowsToRecords(rows);
}

function parseUsStandardCsvRecords(content: string): CsvRecord[] {
    return rowsToRecords(parseDelimited(content, ','));
}

function parseUsFileFallback(file: InMemoryCsvFile): CompiledOccupationRow[] {
    let records = parseUsMarkdownRecords(file.content);
    if (!hasRequiredUsColumns(records)) {
        records = parseUsStandardCsvRecords(file.content);
    }
    if (!hasRequiredUsColumns(records)) {
        return [];
    }

    const industryCode = (file.name.match(/IND_([A-Za-z0-9]+)/)?.[1] || '').trim();
    const compiledRows: CompiledOccupationRow[] = [];

    for (const record of records) {
        const occupationTitle = (record['Occupation Title'] || '').trim();
        if (!occupationTitle || occupationTitle.includes('---')) continue;

        const occupationType = trimOrNull(record['Occupation Type']) || 'Summary';
        const occupationCode = trimOrNull(record['Occupation Code'])?.replace(/[="]/g, '') || null;
        const employment2024 = toNumber(record['2024 Employment']);
        const employment2034 = toNumber(record['Projected 2034 Employment']);
        const industry2024 = toNumber(record['2024 Percent of Industry']);
        const industry2034 = toNumber(record['Projected 2034 Percent of Industry']);
        const occupation2024 = toNumber(record['2024 Percent of Occupation']);
        const occupation2034 = toNumber(record['Projected 2034 Percent of Occupation']);

        if (employment2024 !== null) {
            compiledRows.push({
                dataSource: 'US_BLS_Matrix',
                geography: 'USA',
                industryCode: industryCode || null,
                occupationCode,
                occupationTitle,
                occupationType,
                qualificationLevel: 'Total',
                year: 2024,
                employmentCount: employment2024,
                percentOfIndustry: industry2024,
                percentOfOccupation: occupation2024
            });
        }

        if (employment2034 !== null) {
            compiledRows.push({
                dataSource: 'US_BLS_Matrix',
                geography: 'USA',
                industryCode: industryCode || null,
                occupationCode,
                occupationTitle,
                occupationType,
                qualificationLevel: 'Total',
                year: 2034,
                employmentCount: employment2034,
                percentOfIndustry: industry2034,
                percentOfOccupation: occupation2034
            });
        }
    }

    return compiledRows;
}

async function runPythonCompiler(tempDir: string, outputFilePath: string): Promise<{ ok: boolean; output: string; error?: string }> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'skills21', 'compile_occupations.py');
    const pythonBins = [process.env.PYTHON_BIN, 'python3', 'python'].filter(Boolean) as string[];
    const errors: string[] = [];

    for (const bin of pythonBins) {
        const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
            const child = spawn(
                bin,
                [scriptPath, '--input-dir', tempDir, '--output-file', outputFilePath],
                { stdio: ['ignore', 'pipe', 'pipe'] }
            );

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });
            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });
            child.on('close', (code) => resolve({ code, stdout, stderr }));
            child.on('error', (error) => {
                resolve({
                    code: 1,
                    stdout,
                    stderr: `${stderr}\n${String(error)}`
                });
            });
        });

        if (result.code === 0) {
            return { ok: true, output: result.stdout.trim() || 'Compilador Python ejecutado correctamente.' };
        }

        errors.push(`bin=${bin} stderr=${result.stderr.trim()}`.trim());
    }

    return {
        ok: false,
        output: '',
        error: errors.length > 0
            ? errors.join(' | ')
            : 'No se pudo ejecutar compilador de Python.'
    };
}

function compileFallback(files: InMemoryCsvFile[]): CompiledOccupationRow[] {
    const allRows: CompiledOccupationRow[] = [];

    for (const file of files) {
        const normalizedName = file.name.toLowerCase();
        if (!normalizedName.endsWith('.csv')) continue;

        if (normalizedName.startsWith(EU_FILE_PREFIX.toLowerCase())) {
            allRows.push(...parseEuFileFallback(file));
            continue;
        }

        if (normalizedName.startsWith(US_FILE_PREFIX.toLowerCase())) {
            allRows.push(...parseUsFileFallback(file));
        }
    }

    return allRows;
}

export async function compileOccupationRowsFromFiles(files: InMemoryCsvFile[]): Promise<CompileResult> {
    if (files.length === 0) {
        return {
            rows: [],
            usedPythonCompiler: false,
            compilerMessage: 'No se enviaron archivos.'
        };
    }

    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'skills21-occupations-'));
    const outputFilePath = path.join(tempDir, 'compiled_employment_database.csv');

    try {
        for (const file of files) {
            const safeName = sanitizeFileName(file.name);
            await writeFile(path.join(tempDir, safeName), file.content, 'utf8');
        }

        const pythonResult = await runPythonCompiler(tempDir, outputFilePath);
        if (pythonResult.ok) {
            const compiledContent = await readFile(outputFilePath, 'utf8');
            return {
                rows: parseCompiledCsv(compiledContent),
                usedPythonCompiler: true,
                compilerMessage: pythonResult.output
            };
        }

        const fallbackRows = compileFallback(files);
        return {
            rows: fallbackRows,
            usedPythonCompiler: false,
            compilerMessage: `Fallback TypeScript aplicado. Motivo: ${pythonResult.error || 'desconocido'}`
        };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}
