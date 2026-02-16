import 'server-only';

/**
 * Extracts text from a PDF buffer using pdf-parse.
 * This implementation includes a DOMMatrix polyfill to handle potential 
 * browser-dependency issues in some versions of the underlying pdf.js.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        // Polyfill DOMMatrix for Vercel/Node environment if needed by underlying pdf.js
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).DOMMatrix = class DOMMatrix {
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

        // Use dynamic import for pdf-parse core to bypass the buggy index.js
        // which triggers a test mode in production (ENOENT error).
         
        const pdfModule = await import('pdf-parse/lib/pdf-parse.js');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = (pdfModule as any).default || pdfModule;

        const data = await pdf(buffer);

        if (!data || typeof data.text !== 'string') {
            throw new Error("PDF parsing returned no text content.");
        }

        return data.text;
    } catch (error: unknown) {
        console.error('Error parsing PDF:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse PDF content: ${errorMessage}`);
    }
}
