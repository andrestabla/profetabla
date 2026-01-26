import { prisma } from '@/lib/prisma';
import { SubmissionCard } from '@/components/SubmissionCard';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAssignments() {
    const assignments = await prisma.assignment.findMany({
        include: {
            submissions: true // Including all for now, in reality filter by student session
        },
        orderBy: { dueDate: 'asc' }
    });
    return assignments;
}

export default async function AssignmentsPage() {
    const assignments = await getAssignments();
    const project = await prisma.project.findFirst();

    // Mock checking if user is teacher (In real app, check session)
    const isTeacher = true;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Entregas y Evaluaciones</h1>
                    <p className="text-slate-500">Sube tus avances y recibe feedback de tu tutor.</p>
                </div>
                {isTeacher && project && <CreateAssignmentForm projectId={project.id} />}
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No hay buzones activos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {assignments.map((assignment: any) => (
                        <SubmissionCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
            )}
        </div>
    );
}
