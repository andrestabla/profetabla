import 'server-only';

import { Prisma } from '@prisma/client';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { getR2FileUrl } from '@/lib/r2';

export type RecognitionAwardDocumentData = Prisma.RecognitionAwardGetPayload<{
    include: {
        student: {
            select: {
                id: true;
                name: true;
                email: true;
            };
        };
        project: {
            select: {
                id: true;
                title: true;
                type: true;
            };
        };
        recognitionConfig: {
            select: {
                id: true;
                name: true;
                description: true;
                templateBody: true;
                type: true;
                imageUrl: true;
                logoUrl: true;
                backgroundUrl: true;
                signatureImageUrl: true;
                signatureName: true;
                signatureRole: true;
            };
        };
    };
}>;

type SnapshotMetrics = {
    averageGrade: number | null;
    submittedAssignments: number;
    gradedAssignments: number;
    totalAssignments: number;
};

function parseSnapshotMetrics(snapshot: Prisma.JsonValue | null): SnapshotMetrics {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        return {
            averageGrade: null,
            submittedAssignments: 0,
            gradedAssignments: 0,
            totalAssignments: 0
        };
    }

    const value = snapshot as Record<string, unknown>;
    const metrics = (value.metrics && typeof value.metrics === 'object' && !Array.isArray(value.metrics))
        ? value.metrics as Record<string, unknown>
        : {};

    const averageGradeRaw = metrics.averageGrade;
    const averageGrade = typeof averageGradeRaw === 'number' ? averageGradeRaw : null;

    return {
        averageGrade,
        submittedAssignments: typeof metrics.submittedAssignments === 'number' ? metrics.submittedAssignments : 0,
        gradedAssignments: typeof metrics.gradedAssignments === 'number' ? metrics.gradedAssignments : 0,
        totalAssignments: typeof metrics.totalAssignments === 'number' ? metrics.totalAssignments : 0
    };
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function buildTemplateText(award: RecognitionAwardDocumentData, metrics: SnapshotMetrics): string {
    const template = award.recognitionConfig.templateBody?.trim();
    const defaultText = award.recognitionConfig.type === 'CERTIFICATE'
        ? 'Se certifica que [student] completó satisfactoriamente [project] y obtuvo este reconocimiento académico.'
        : '[student] ha obtenido la insignia [recognition] por su desempeño en [project].';

    const raw = template || defaultText;
    const replacements: Record<string, string> = {
        '[student]': award.student.name || award.student.email || 'Estudiante',
        '[project]': award.project.title,
        '[recognition]': award.recognitionConfig.name,
        '[date]': formatDate(award.awardedAt),
        '[average]': metrics.averageGrade !== null ? metrics.averageGrade.toFixed(2) : 'N/D',
        '[submitted]': String(metrics.submittedAssignments),
        '[graded]': String(metrics.gradedAssignments),
        '[total]': String(metrics.totalAssignments)
    };

    return Object.entries(replacements).reduce((acc, [token, value]) => acc.split(token).join(value), raw);
}

type PdfImageFormat = 'PNG' | 'JPEG';

function resolveImageFormatFromMime(mime: string): PdfImageFormat {
    if (mime.includes('png')) return 'PNG';
    return 'JPEG';
}

async function toPdfImage(url: string | null | undefined): Promise<{ dataUrl: string; format: PdfImageFormat } | null> {
    if (!url) return null;
    let trimmed = url.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:image/')) {
        const mime = trimmed.slice(5, trimmed.indexOf(';')).toLowerCase();
        if (mime.includes('webp')) return null;
        return {
            dataUrl: trimmed,
            format: resolveImageFormatFromMime(mime)
        };
    }

    if (trimmed.startsWith('/api/file?key=')) {
        const key = decodeURIComponent(trimmed.split('key=')[1] || '');
        if (key) {
            const signed = await getR2FileUrl(key);
            if (signed && signed !== '#') trimmed = signed;
        }
    } else if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        const signed = await getR2FileUrl(trimmed);
        if (signed && signed !== '#') trimmed = signed;
    }

    if (trimmed.includes('/api/file?key=')) {
        try {
            const parsed = new URL(trimmed);
            const key = parsed.searchParams.get('key');
            if (key) {
                const signed = await getR2FileUrl(key);
                if (signed && signed !== '#') trimmed = signed;
            }
        } catch {
            return null;
        }
    }

    try {
        const res = await fetch(trimmed, { cache: 'no-store' });
        if (!res.ok) return null;
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!contentType.startsWith('image/')) return null;
        if (contentType.includes('webp')) return null;

        const arrayBuffer = await res.arrayBuffer();
        const mime = contentType.split(';')[0];
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
            dataUrl: `data:${mime};base64,${base64}`,
            format: resolveImageFormatFromMime(mime)
        };
    } catch {
        return null;
    }
}

export async function buildRecognitionPdfBuffer(award: RecognitionAwardDocumentData, verificationUrl: string): Promise<Buffer> {
    const metrics = parseSnapshotMetrics(award.snapshot);
    const [backgroundImage, logoImage, signatureImage] = await Promise.all([
        toPdfImage(award.recognitionConfig.backgroundUrl),
        toPdfImage(award.recognitionConfig.logoUrl || award.recognitionConfig.imageUrl),
        toPdfImage(award.recognitionConfig.signatureImageUrl)
    ]);

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;

    if (backgroundImage) {
        doc.addImage(backgroundImage.dataUrl, backgroundImage.format, 0, 0, pageWidth, pageHeight);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(36, 36, pageWidth - 72, pageHeight - 72, 14, 14, 'F');
    } else {
        doc.setFillColor(246, 248, 252);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.roundedRect(28, 28, pageWidth - 56, pageHeight - 56, 14, 14, 'S');

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(46, 42, pageWidth - 92, 50, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ProfeTabla • Verificación Académica', centerX, 74, { align: 'center' });
    if (logoImage) {
        doc.addImage(logoImage.dataUrl, logoImage.format, 56, 48, 56, 56);
    }

    const heading = award.recognitionConfig.type === 'CERTIFICATE' ? 'CERTIFICADO' : 'INSIGNIA DE LOGRO';
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(38);
    doc.text(heading, centerX, 156, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('Otorgado a', centerX, 192, { align: 'center' });

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(31);
    doc.text(award.student.name || award.student.email || 'Estudiante', centerX, 232, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(award.recognitionConfig.name, centerX, 268, { align: 'center' });

    const mainBody = buildTemplateText(award, metrics);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const bodyLines = doc.splitTextToSize(mainBody, pageWidth - 200);
    doc.text(bodyLines, centerX, 304, { align: 'center', baseline: 'top' });

    const yMeta = 388;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Proyecto: ${award.project.title}`, 70, yMeta);
    doc.text(`Tipo: ${award.project.type === 'CHALLENGE' ? 'Reto' : award.project.type === 'PROBLEM' ? 'Problema' : 'Proyecto'}`, 70, yMeta + 18);
    doc.text(`Fecha de otorgamiento: ${formatDate(award.awardedAt)}`, 70, yMeta + 36);
    doc.text(`Código de verificación: ${award.verificationCode}`, 70, yMeta + 54);

    doc.text(`Entregas: ${metrics.submittedAssignments}/${metrics.totalAssignments}`, 380, yMeta);
    doc.text(`Calificadas: ${metrics.gradedAssignments}/${metrics.totalAssignments}`, 380, yMeta + 18);
    doc.text(`Promedio: ${metrics.averageGrade !== null ? metrics.averageGrade.toFixed(2) : 'N/D'}`, 380, yMeta + 36);

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 140,
        margin: 1
    });
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 195, pageHeight - 205, 130, 130);

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Escanea para verificar autenticidad', pageWidth - 130, pageHeight - 66, { align: 'center' });

    const signatureName = award.recognitionConfig.signatureName?.trim() || 'Dirección Académica';
    const signatureRole = award.recognitionConfig.signatureRole?.trim() || 'ProfeTabla';
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(70, pageHeight - 80, 260, pageHeight - 80);
    if (signatureImage) {
        doc.addImage(signatureImage.dataUrl, signatureImage.format, 92, pageHeight - 132, 130, 44);
    }
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${signatureName} - ${signatureRole}`, 70, pageHeight - 64);

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
}
