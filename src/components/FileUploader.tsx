'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
    assignmentId: string;
    onUploadComplete: (submission: any) => void;
}

export function FileUploader({ assignmentId, onUploadComplete }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            setError("El archivo excede el límite de 2MB.");
            return;
        }

        setError(null);
        setUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;

            try {
                const res = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assignmentId,
                        fileUrl: base64,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size
                    })
                });

                if (!res.ok) throw new Error("Error al subir");

                const submission = await res.json();
                onUploadComplete(submission);
            } catch (err) {
                setError("Error al subir el archivo. Inténtalo de nuevo.");
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = () => {
            setError("Error al leer el archivo.");
            setUploading(false);
        };

    }, [assignmentId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
                    }`}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center text-blue-600">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm font-medium">Subiendo archivo...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="font-medium text-slate-700">Arrastra tu archivo aquí</p>
                        <p className="text-xs mt-1">o haz clic para seleccionar (PDF, PNG, DOCX - Max 2MB)</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
