import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRecognitionPdfBuffer } from '@/lib/recognition-documents';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ awardId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { awardId } = await context.params;
        if (!awardId) {
            return NextResponse.json({ error: 'Falta ID del reconocimiento' }, { status: 400 });
        }

        const award = await prisma.recognitionAward.findUnique({
            where: { id: awardId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        teachers: {
                            select: { id: true }
                        }
                    }
                },
                recognitionConfig: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        templateBody: true,
                        type: true,
                        imageUrl: true,
                        logoUrl: true,
                        backgroundUrl: true,
                        signatureImageUrl: true,
                        signatureName: true,
                        signatureRole: true
                    }
                }
            }
        });

        if (!award) {
            return NextResponse.json({ error: 'Reconocimiento no encontrado' }, { status: 404 });
        }

        const isOwner = award.studentId === session.user.id;
        const isAdmin = session.user.role === 'ADMIN';
        const isTeacherOfProject = award.project.teachers.some((teacher) => teacher.id === session.user.id);
        const canDownload = isOwner || isAdmin || isTeacherOfProject;

        if (!canDownload) {
            return NextResponse.json({ error: 'No tienes permisos para descargar este documento' }, { status: 403 });
        }

        if (award.isRevoked) {
            return NextResponse.json({ error: 'Este reconocimiento fue revocado y ya no es descargable' }, { status: 410 });
        }

        const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
        const verificationUrl = `${origin}/verify/recognition/${award.verificationCode}`;
        const pdfBuffer = await buildRecognitionPdfBuffer(award, verificationUrl);

        const fileName = `${award.recognitionConfig.type === 'CERTIFICATE' ? 'certificado' : 'insignia'}_${award.student.name || award.student.id}_${award.id}.pdf`
            .replace(/\s+/g, '_')
            .toLowerCase();

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'private, no-store'
            }
        });
    } catch (error) {
        console.error('Error generating recognition PDF:', error);
        return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
    }
}
