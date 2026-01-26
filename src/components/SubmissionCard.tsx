'use client';

import { useState } from 'react';
import { FileUploader } from './FileUploader';
import { FileIcon, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
    id: string;
    fileName: string;
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    submissions: Submission[];
}

export function SubmissionCard({ assignment }: { assignment: Assignment }) {
    const [submission, setSubmission] = useState<Submission | null>(
        assignment.submissions?.[0] || null
    );

    const isLate = new Date() > new Date(assignment.dueDate);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{assignment.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{assignment.description}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                    <Clock className="w-3 h-3" />
                    {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
            </div>

            <div className="mt-6">
                {submission ? (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-700">Tarea Enviada</h4>
                                <p className="text-xs text-slate-400">
                                    {new Date(submission.submittedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100">
                            <FileIcon className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{submission.fileName}</span>
                        </div>

                        {submission.grade !== null && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-600">Calificación:</span>
                                    <span className="text-xl font-bold text-blue-600">{submission.grade}/7.0</span>
                                </div>
                                {submission.feedback && (
                                    <div className="text-sm text-slate-500 italic bg-amber-50 p-2 rounded">
                                        "{submission.feedback}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Subir Entrega</h4>
                        <FileUploader
                            assignmentId={assignment.id}
                            onUploadComplete={(sub) => setSubmission(sub)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
