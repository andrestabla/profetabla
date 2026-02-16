import 'server-only';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
         
        const pdf = (await import('pdf-parse')).default;
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF content');
    }
}
