import 'server-only';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
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

        const { PdfDataParser } = await import('pdf-data-parser');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser = new PdfDataParser({ data: buffer as any });
        const data = await parser.parse();

        if (!data || !Array.isArray(data)) return "";

        // data is an array of arrays (rows), we need to join them
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((row: any) => Array.isArray(row) ? row.join(' ') : String(row)).join('\n');
    } catch (error: unknown) {
        console.error('Error parsing PDF:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse PDF content: ${errorMessage}`);
    }
}
