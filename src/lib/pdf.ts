import 'server-only';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
         
        const { PdfDataParser } = await import('pdf-data-parser');
        // Explicitly cast buffer to any if type definition is missing 'data' option but it exists in library
        const parser = new PdfDataParser({ data: buffer });
        const data = await parser.parse();

        if (!data || !Array.isArray(data)) return "";

        // data is an array of arrays (rows), we need to join them
        return data.map((row: string[]) => row.join(' ')).join('\n');
    } catch (error: unknown) {
        console.error('Error parsing PDF:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse PDF content: ${errorMessage}`);
    }
}
