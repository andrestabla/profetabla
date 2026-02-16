import 'server-only';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
         
        const pdfModule = await import('pdf-parse');
        // Handle both CJS (default export) and ESM interop
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdf = (pdfModule as any).default || pdfModule;

        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF content');
    }
}
