import 'server-only';
import * as mammoth from 'mammoth';
import * as officeparser from 'officeparser';
import * as XLSX from 'xlsx';

/**
 * Extracts text from a PDF buffer using pdf-parse.
 * This implementation includes a DOMMatrix polyfill to handle potential 
 * browser-dependency issues in some versions of the underlying pdf.js.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        // Polyfill DOMMatrix for Vercel/Node environment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (global as any).DOMMatrix = class DOMMatrix {
                a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
                constructor(init?: number[]) {
                    if (init && Array.isArray(init) && init.length >= 6) {
                        this.a = init[0]; this.b = init[1];
                        this.c = init[2]; this.d = init[3];
                        this.e = init[4]; this.f = init[5];
                    }
                }
            };
        }

        // We use a dynamic import for the legacy entry point of pdf-parse
        // to bypass issues with its index.js on some serverless platforms.
        const { default: PDFParser } = await import('pdf-parse/lib/pdf-parse.js');

        const data = await PDFParser(buffer);
        return data.text || '';
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to parse PDF content: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Unified document parser that routes to the correct extractor based on file extension.
 */
export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
    const extension = fileName.toLowerCase().split('.').pop();

    try {
        switch (extension) {
            case 'pdf':
                return await extractTextFromPdf(buffer);

            case 'docx':
                const docxResult = await mammoth.extractRawText({ buffer });
                return docxResult.value;

            case 'pptx':
                return new Promise((resolve, reject) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    officeparser.parseOffice(buffer, (data: any, err: any) => {
                        if (err) return reject(new Error(`Failed to parse PPTX: ${err}`));
                        resolve(data);
                    });
                });

            case 'xlsx':
            case 'xls':
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                let excelText = '';
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    excelText += `Sheet: ${sheetName}\n`;
                    excelText += XLSX.utils.sheet_to_csv(worksheet) + '\n\n';
                });
                return excelText;

            default:
                // Try as plain text if unknown
                return buffer.toString('utf8');
        }
    } catch (error) {
        console.error(`Error parsing ${extension} file:`, error);
        throw new Error(`Error al procesar el archivo ${extension}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
