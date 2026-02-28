
'use client';

import { useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { BookOpen, Video, FileText, Plus, Link as LinkIcon, Calendar, Kanban, Sparkles, FileCheck, Edit3, Cloud, Upload, X, Play, Maximize2, Wand2, Users, Search, AlertTriangle, MessageSquare, Award, BadgeCheck, Ban, Download, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
    addResourceToProjectAction,
    getProjectDriveFilesAction,
    uploadProjectFileToDriveAction,
    uploadProjectFileToR2Action,
    extractResourceMetadataAction,
    updateProjectResourceAction,
    initializeProjectDriveFolderAction,
    uploadRecognitionAssetToR2Action,
    upsertRecognitionConfigAction,
    deleteRecognitionConfigAction,
    recomputeRecognitionsAction,
    revokeRecognitionAwardAction
} from './actions';
import { searchStudentsAction, addStudentToProjectAction, removeStudentFromProjectAction, searchTeachersAction, addTeacherToProjectAction, removeTeacherFromProjectAction } from '@/app/actions/project-enrollment';
import { BookingList } from '@/components/BookingList';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';
import { SubmissionCard } from '@/components/SubmissionCard';
import { OAPickerModal } from '@/components/OAPickerModal';
import { DriveSelectorModal } from '@/components/DriveSelectorModal';
import { EnrollmentControls } from '@/components/EnrollmentControls';
import { TeamManagement } from '@/components/TeamManagement';
import { useSession } from 'next-auth/react';
import ProjectCommunications from '@/components/ProjectCommunications';
import { useModals } from '@/components/ModalProvider';

// Tipos basados en nuestro esquema Prisma actualizado
type Resource = {
    id: string;
    title: string;
    url: string;
    type: string;
    presentation?: string | null;
    utility?: string | null;
    subject?: string | null;
    competency?: string | null;
    keywords?: string[];
    createdAt: Date;
    originalUrl?: string;
    citationAuthor?: string | null;
    apaReference?: string | null;
    shouldEmbed?: boolean;
};

// ... (Project type remains same)
type Project = {
    id: string;
    title: string;
    description: string;
    industry?: string | null;
    googleDriveFolderId?: string | null;
    status: string;
    type?: string;
    students: { id: string; name: string | null; email: string | null; avatarUrl?: string | null }[];
    teachers: { id: string; name: string | null; email: string | null; avatarUrl?: string | null }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teams?: any[];
    accessCode?: string;
};

type RecognitionConfig = {
    id: string;
    type: 'CERTIFICATE' | 'BADGE';
    name: string;
    description?: string | null;
    templateBody?: string | null;
    imageUrl?: string | null;
    logoUrl?: string | null;
    backgroundUrl?: string | null;
    signatureImageUrl?: string | null;
    signatureName?: string | null;
    signatureRole?: string | null;
    autoAward: boolean;
    requireAllAssignments: boolean;
    requireAllGradedAssignments: boolean;
    minCompletedAssignments?: number | null;
    minGradedAssignments?: number | null;
    minAverageGrade?: number | null;
    isActive: boolean;
    createdAt: Date | string;
    _count?: { awards: number };
    awards: {
        id: string;
        verificationCode: string;
        awardedAt: Date | string;
        isRevoked: boolean;
        revokedAt?: Date | string | null;
        revokedReason?: string | null;
        student: {
            id: string;
            name: string | null;
            email: string | null;
        };
    }[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProjectWorkspaceClient({
    project,
    resources,
    learningObjects,
    assignments,
    recognitionConfigs
}: {
    project: Project,
    resources: Resource[],
    learningObjects: any[],
    assignments: any[],
    recognitionConfigs: RecognitionConfig[]
}) {
    // ... (existing state) ...
    const { showAlert, showConfirm } = useModals();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'KANBAN' | 'RESOURCES' | 'MENTORSHIP' | 'ASSIGNMENTS' | 'TEAM' | 'COMMS' | 'RECOGNITIONS'>('RESOURCES');
    const [isUploading, setIsUploading] = useState(false);
    // const [showContext, setShowContext] = useState(false);
    const [resourceType, setResourceType] = useState('ARTICLE');
    const [driveFiles, setDriveFiles] = useState<any[]>([]);

    const [isLoadingDrive, setIsLoadingDrive] = useState(false);
    const [selectedDriveFile, setSelectedDriveFile] = useState<{ title: string, url: string } | null>(null);
    const [driveMode, setDriveMode] = useState<'LINK' | 'UPLOAD'>('LINK');
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [isInitializingFolder, setIsInitializingFolder] = useState(false);
    const [viewerResource, setViewerResource] = useState<Resource | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    // Student Search State
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);

    // Teacher Search State
    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);

    // ... (Handlers remain same) ...
    const handleSearchStudents = async (query: string) => {
        setStudentSearchQuery(query);
        if (query.length < 2) {
            setStudentSearchResults([]);
            return;
        }
        setIsSearchingStudents(true);
        try {
            const res = await searchStudentsAction(query, project.id);
            if (res.success) {
                setStudentSearchResults(res.data || []);
            }
        } finally {
            setIsSearchingStudents(false);
        }
    };

    const handleAddStudent = async (studentId: string) => {
        await addStudentToProjectAction(project.id, studentId);
        setStudentSearchQuery('');
        setStudentSearchResults([]);
        window.location.reload();
    };

    const handleRemoveStudent = async (studentId: string) => {
        const confirmRemove = await showConfirm(
            "¿Expulsar estudiante?",
            "¿Estás seguro de querer expulsar a este estudiante del proyecto?",
            "danger"
        );
        if (!confirmRemove) return;
        await removeStudentFromProjectAction(project.id, studentId);
        window.location.reload();
    };

    const handleSearchTeachers = async (query: string) => {
        setTeacherSearchQuery(query);
        if (query.length < 2) {
            setTeacherSearchResults([]);
            return;
        }
        setIsSearchingTeachers(true);
        try {
            const res = await searchTeachersAction(query, project.id);
            if (res.success) {
                setTeacherSearchResults(res.data || []);
            }
        } finally {
            setIsSearchingTeachers(false);
        }
    };

    const handleAddTeacher = async (teacherId: string) => {
        await addTeacherToProjectAction(project.id, teacherId);
        setTeacherSearchQuery('');
        setTeacherSearchResults([]);
        window.location.reload();
    };

    const handleRemoveTeacher = async (teacherId: string) => {
        const confirmRemove = await showConfirm(
            "¿Retirar profesor?",
            "¿Estás seguro de querer retirar a este profesor del proyecto?",
            "danger"
        );
        if (!confirmRemove) return;
        await removeTeacherFromProjectAction(project.id, teacherId);
        window.location.reload();
    };


    // Metadata form states
    const [metaTitle, setMetaTitle] = useState('');
    const [metaPresentation, setMetaPresentation] = useState('');
    const [metaUtility, setMetaUtility] = useState('');
    const [metaSubject, setMetaSubject] = useState('');
    const [metaCompetency, setMetaCompetency] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');
    const [metaUrl, setMetaUrl] = useState('');
    const [metaCitationAuthor, setMetaCitationAuthor] = useState('');
    const [metaApaReference, setMetaApaReference] = useState('');
    const [metaShouldEmbed, setMetaShouldEmbed] = useState(true);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isOAModalOpen, setIsOAModalOpen] = useState(false);

    // Filter State
    const [filterStudentId, setFilterStudentId] = useState('ALL');

    // Recognition form state
    const [editingRecognitionId, setEditingRecognitionId] = useState<string | null>(null);
    const [recognitionType, setRecognitionType] = useState<'CERTIFICATE' | 'BADGE'>('BADGE');
    const [recognitionName, setRecognitionName] = useState('');
    const [recognitionDescription, setRecognitionDescription] = useState('');
    const [recognitionTemplateBody, setRecognitionTemplateBody] = useState('');
    const [recognitionImageUrl, setRecognitionImageUrl] = useState('');
    const [recognitionLogoUrl, setRecognitionLogoUrl] = useState('');
    const [recognitionBackgroundUrl, setRecognitionBackgroundUrl] = useState('');
    const [recognitionSignatureImageUrl, setRecognitionSignatureImageUrl] = useState('');
    const [recognitionSignatureName, setRecognitionSignatureName] = useState('');
    const [recognitionSignatureRole, setRecognitionSignatureRole] = useState('');
    const [recognitionRequireAllAssignments, setRecognitionRequireAllAssignments] = useState(true);
    const [recognitionRequireAllGraded, setRecognitionRequireAllGraded] = useState(false);
    const [recognitionMinCompleted, setRecognitionMinCompleted] = useState('');
    const [recognitionMinGraded, setRecognitionMinGraded] = useState('');
    const [recognitionMinAverageGrade, setRecognitionMinAverageGrade] = useState('');
    const [recognitionAutoAward, setRecognitionAutoAward] = useState(true);
    const [recognitionIsActive, setRecognitionIsActive] = useState(true);
    const [isSavingRecognition, setIsSavingRecognition] = useState(false);
    const [isRecomputingRecognitions, setIsRecomputingRecognitions] = useState(false);
    const [revokingAwardId, setRevokingAwardId] = useState<string | null>(null);
    const [uploadingRecognitionField, setUploadingRecognitionField] = useState<string | null>(null);

    const resetRecognitionForm = () => {
        setEditingRecognitionId(null);
        setRecognitionType('BADGE');
        setRecognitionName('');
        setRecognitionDescription('');
        setRecognitionTemplateBody('');
        setRecognitionImageUrl('');
        setRecognitionLogoUrl('');
        setRecognitionBackgroundUrl('');
        setRecognitionSignatureImageUrl('');
        setRecognitionSignatureName('');
        setRecognitionSignatureRole('');
        setRecognitionRequireAllAssignments(true);
        setRecognitionRequireAllGraded(false);
        setRecognitionMinCompleted('');
        setRecognitionMinGraded('');
        setRecognitionMinAverageGrade('');
        setRecognitionAutoAward(true);
        setRecognitionIsActive(true);
    };

    const handleEditRecognitionConfig = (config: RecognitionConfig) => {
        setEditingRecognitionId(config.id);
        setRecognitionType(config.type);
        setRecognitionName(config.name || '');
        setRecognitionDescription(config.description || '');
        setRecognitionTemplateBody(config.templateBody || '');
        setRecognitionImageUrl(config.imageUrl || '');
        setRecognitionLogoUrl(config.logoUrl || '');
        setRecognitionBackgroundUrl(config.backgroundUrl || '');
        setRecognitionSignatureImageUrl(config.signatureImageUrl || '');
        setRecognitionSignatureName(config.signatureName || '');
        setRecognitionSignatureRole(config.signatureRole || '');
        setRecognitionRequireAllAssignments(Boolean(config.requireAllAssignments));
        setRecognitionRequireAllGraded(Boolean(config.requireAllGradedAssignments));
        setRecognitionMinCompleted(config.minCompletedAssignments != null ? String(config.minCompletedAssignments) : '');
        setRecognitionMinGraded(config.minGradedAssignments != null ? String(config.minGradedAssignments) : '');
        setRecognitionMinAverageGrade(config.minAverageGrade != null ? String(config.minAverageGrade) : '');
        setRecognitionAutoAward(Boolean(config.autoAward));
        setRecognitionIsActive(Boolean(config.isActive));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveRecognitionConfig = async () => {
        if (!recognitionName.trim()) {
            await showAlert('Dato faltante', 'Debes indicar un nombre para la insignia o certificado.', 'error');
            return;
        }

        setIsSavingRecognition(true);
        try {
            const payload = new FormData();
            payload.append('projectId', project.id);
            if (editingRecognitionId) payload.append('configId', editingRecognitionId);
            payload.append('type', recognitionType);
            payload.append('name', recognitionName.trim());
            payload.append('description', recognitionDescription.trim());
            payload.append('templateBody', recognitionTemplateBody.trim());
            payload.append('imageUrl', recognitionImageUrl.trim());
            payload.append('logoUrl', recognitionLogoUrl.trim());
            payload.append('backgroundUrl', recognitionBackgroundUrl.trim());
            payload.append('signatureImageUrl', recognitionSignatureImageUrl.trim());
            payload.append('signatureName', recognitionSignatureName.trim());
            payload.append('signatureRole', recognitionSignatureRole.trim());
            payload.append('requireAllAssignments', recognitionRequireAllAssignments ? 'true' : 'false');
            payload.append('requireAllGradedAssignments', recognitionRequireAllGraded ? 'true' : 'false');
            payload.append('minCompletedAssignments', recognitionMinCompleted.trim());
            payload.append('minGradedAssignments', recognitionMinGraded.trim());
            payload.append('minAverageGrade', recognitionMinAverageGrade.trim());
            payload.append('autoAward', recognitionAutoAward ? 'true' : 'false');
            payload.append('isActive', recognitionIsActive ? 'true' : 'false');

            const result = await upsertRecognitionConfigAction(payload);
            if (!result.success) {
                await showAlert('No se pudo guardar', result.error || 'Error guardando configuración.', 'error');
                return;
            }

            await showAlert('Guardado', 'Configuración de reconocimiento actualizada.', 'success');
            window.location.reload();
        } finally {
            setIsSavingRecognition(false);
        }
    };

    const handleDeleteRecognitionConfig = async (configId: string) => {
        const confirmed = await showConfirm(
            'Eliminar reconocimiento',
            'Esta acción eliminará la configuración y sus otorgamientos asociados.',
            'danger'
        );
        if (!confirmed) return;

        const result = await deleteRecognitionConfigAction(project.id, configId);
        if (!result.success) {
            await showAlert('No se pudo eliminar', result.error || 'Error eliminando configuración.', 'error');
            return;
        }

        await showAlert('Eliminado', 'Configuración eliminada correctamente.', 'success');
        window.location.reload();
    };

    const handleRevokeAward = async (award: RecognitionConfig['awards'][number]) => {
        const studentLabel = award.student.name || award.student.email || 'este estudiante';
        const confirmed = await showConfirm(
            'Revocar reconocimiento',
            `Se invalidará el certificado/insignia de ${studentLabel}. ¿Deseas continuar?`,
            'danger'
        );
        if (!confirmed) return;

        const reason = window.prompt('Motivo de revocación (opcional):', '') || '';

        setRevokingAwardId(award.id);
        try {
            const result = await revokeRecognitionAwardAction(project.id, award.id, reason);
            if (!result.success) {
                await showAlert('No se pudo revocar', result.error || 'Error revocando reconocimiento.', 'error');
                return;
            }

            await showAlert('Revocado', 'El reconocimiento fue invalidado correctamente.', 'success');
            window.location.reload();
        } finally {
            setRevokingAwardId(null);
        }
    };

    const resolveRecognitionAssetPreviewUrl = (value?: string | null) => {
        const raw = (value || '').trim();
        if (!raw) return '';
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/')) return raw;

        if (raw.startsWith('/api/file?key=')) return raw;

        if (raw.includes('key=')) {
            try {
                const asUrl = new URL(raw);
                const key = asUrl.searchParams.get('key');
                if (key) return `/api/file?key=${encodeURIComponent(key)}`;
            } catch {
                // fallthrough to key mode
            }
        }

        return `/api/file?key=${encodeURIComponent(raw)}`;
    };

    const handleRecognitionAssetUpload = async (
        file: File,
        field: 'imageUrl' | 'logoUrl' | 'backgroundUrl' | 'signatureImageUrl'
    ) => {
        if (!file.type.startsWith('image/')) {
            await showAlert('Formato no válido', 'Solo se permiten imágenes para esta carga.', 'error');
            return;
        }

        setUploadingRecognitionField(field);
        try {
            const payload = new FormData();
            payload.append('projectId', project.id);
            payload.append('file', file);

            const result = await uploadRecognitionAssetToR2Action(payload);
            if (!result.success || !('key' in result) || typeof result.key !== 'string') {
                await showAlert('Error de carga', result.error || 'No se pudo subir el archivo.', 'error');
                return;
            }

            const uploadedKey = result.key;
            if (field === 'imageUrl') setRecognitionImageUrl(uploadedKey);
            if (field === 'logoUrl') setRecognitionLogoUrl(uploadedKey);
            if (field === 'backgroundUrl') setRecognitionBackgroundUrl(uploadedKey);
            if (field === 'signatureImageUrl') setRecognitionSignatureImageUrl(uploadedKey);

            await showAlert('Archivo cargado', 'Imagen subida correctamente a R2.', 'success');
        } finally {
            setUploadingRecognitionField(null);
        }
    };

    const handleRecomputeRecognitions = async () => {
        setIsRecomputingRecognitions(true);
        try {
            const result = await recomputeRecognitionsAction(project.id);
            if (!result.success) {
                await showAlert('No se pudo recalcular', result.error || 'Error recalculando.', 'error');
                return;
            }

            const studentCount = 'studentCount' in result ? result.studentCount : 0;
            const createdAwards = 'createdAwards' in result ? result.createdAwards : 0;
            await showAlert(
                'Recalculado',
                `Se evaluaron ${studentCount} estudiantes y se generaron ${createdAwards} reconocimientos.`,
                'success'
            );
            window.location.reload();
        } finally {
            setIsRecomputingRecognitions(false);
        }
    };

    // Fetch drive files if configured
    const handleFetchDriveFiles = async () => {
        if (!project.googleDriveFolderId) return;
        setIsLoadingDrive(true);
        try {
            const files = await getProjectDriveFilesAction(project.googleDriveFolderId);
            setDriveFiles(files);
        } catch (e) {
            console.error("Error fetching drive files", e);
        } finally {
            setIsLoadingDrive(false);
        }
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);
        setResourceType(resource.type);
        setMetaTitle(resource.title);
        setMetaUrl(resource.originalUrl || resource.url);
        setMetaPresentation(resource.presentation || '');
        setMetaUtility(resource.utility || '');
        setMetaSubject(resource.subject || '');
        setMetaCompetency(resource.competency || '');
        setMetaKeywords(resource.keywords?.join(', ') || '');
        setMetaCitationAuthor(resource.citationAuthor || '');
        setMetaApaReference(resource.apaReference || '');
        setMetaShouldEmbed(resource.shouldEmbed !== false); // Default true if undefined

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingResource(null);
        setMetaTitle('');
        setMetaUrl('');
        setMetaPresentation('');
        setMetaUtility('');
        setMetaSubject('');
        setMetaCompetency('');
        setMetaKeywords('');
        setMetaCitationAuthor('');
        setMetaApaReference('');
        setMetaShouldEmbed(true);
        setResourceType('ARTICLE');
    };

    const ResourceIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5 text-red-500" />;
            case 'ARTICLE': return <FileText className="w-5 h-5 text-blue-500" />;
            case 'EMBED': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'DRIVE': return <Cloud className="w-5 h-5 text-emerald-500" />;
            case 'FILE': return <FileText className="w-5 h-5 text-slate-500" />;
            default: return <BookOpen className="w-5 h-5 text-slate-400" />;
        }
    };

    const handleExtractMetadata = async (urlOverride?: string, typeOverride?: string) => {
        setIsExtracting(true);
        try {
            const type = typeOverride || resourceType;
            let context = urlOverride;

            if (!context) {
                if (type === 'DRIVE') {
                    context = selectedDriveFile?.url || metaUrl || metaTitle;
                } else {
                    context = metaUrl;
                }
            }

            const result = await extractResourceMetadataAction(context || '', type);
            if (result.success && result.data) {
                setMetaTitle(result.data.title);
                setMetaPresentation(result.data.presentation);
                setMetaUtility(result.data.utility);
                setMetaSubject(result.data.subject);
                setMetaCompetency(result.data.competency);
                setMetaKeywords(result.data.keywords ? result.data.keywords.join(', ') : '');
                setMetaCitationAuthor(result.data.citationAuthor || '');
                setMetaApaReference(result.data.apaReference || '');
            } else {
                await showAlert("Error", result.error || "No se pudo extraer metadatos", "error");
            }
        } catch (e) {
            console.error(e);
            await showAlert("Error", 'Error al conectar con la IA', "error");
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans">
            {/* Cabecera */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="w-full md:w-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Proyecto Activo</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-500 text-xs font-medium">{project.industry || 'Educación'}</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                                {project.title}
                            </h1>
                            {project.students && project.students.length > 0 && (
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    Estudiantes: <span className="text-slate-900 font-bold">
                                        {project.students.map(s => s.name).join(', ')}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <Link
                                href={`/dashboard/professor/projects/${project.id}/edit`}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-slate-600 font-bold bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-xs"
                            >
                                <Edit3 className="w-4 h-4" /> Editar Metadatos
                            </Link>
                            {project.googleDriveFolderId && (
                                <a
                                    href={`https://drive.google.com/drive/folders/${project.googleDriveFolderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-blue-600 font-bold bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all text-xs"
                                >
                                    <Cloud className="w-4 h-4" /> Drive
                                </a>
                            )}
                        </div>
                    </div>



                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
                        <button onClick={() => setActiveTab('KANBAN')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'KANBAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Kanban className="w-4 h-4" /> Kanban
                        </button>
                        <button onClick={() => setActiveTab('RESOURCES')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'RESOURCES' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <BookOpen className="w-4 h-4" /> Recursos
                        </button>
                        <button onClick={() => setActiveTab('MENTORSHIP')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'MENTORSHIP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Calendar className="w-4 h-4" /> Mentorías
                        </button>
                        <button onClick={() => setActiveTab('ASSIGNMENTS')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'ASSIGNMENTS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <FileCheck className="w-4 h-4" /> Entregables
                        </button>
                        <button onClick={() => setActiveTab('RECOGNITIONS')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'RECOGNITIONS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Award className="w-4 h-4" /> Certificados & Insignias
                        </button>
                        <button onClick={() => setActiveTab('COMMS')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'COMMS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <MessageSquare className="w-4 h-4" /> Comunicaciones
                        </button>
                        <button onClick={() => setActiveTab('TEAM')} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm shrink-0 ${activeTab === 'TEAM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Users className="w-4 h-4" /> Equipo
                        </button>
                    </div>
                </div>

                {/* ... (existing context toggle) ... */}
            </div>

            {/* Contenido Principal */}
            {
                activeTab === 'COMMS' && (
                    <div className="animate-in fade-in duration-300">
                        <ProjectCommunications projectId={project.id} currentUserId={session?.user?.id || ''} />
                    </div>
                )
            }

            {
                activeTab === 'TEAM' && (
                    <div className="animate-in fade-in duration-300 space-y-8">
                        {/* Gestor de Equipos */}
                        {session?.user && (
                            <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <TeamManagement
                                    teams={project.teams || []}
                                    projectId={project.id}
                                    currentUser={session.user}
                                    projectType={project.type || 'PROJECT'}
                                />
                            </section>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                {/* Professors Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-600" /> Profesores del Proyecto
                                    </h3>
                                    {project.teachers && project.teachers.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {project.teachers.map((teacher, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                                            {teacher.avatarUrl ? <img src={teacher.avatarUrl} alt={teacher.name || ''} className="w-full h-full object-cover" /> : (teacher.name?.[0] || 'P')}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{teacher.name}</p>
                                                            <p className="text-xs text-slate-500 truncate max-w-[120px]" title={teacher.email || ''}>{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                    {/* Don't allow removing oneself? Or just allow it with a warning */}
                                                    <button
                                                        onClick={() => handleRemoveTeacher(teacher.id)}
                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Retirar del proyecto"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No hay profesores vinculados (error?).</p>
                                    )}

                                    {/* Search for Adding Teachers */}
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <h4 className="font-bold text-slate-700 text-sm mb-3">Vincular Co-Profesor</h4>
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                                <Search className="w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar profesor por nombre o correo..."
                                                    className="bg-transparent border-none outline-none text-sm w-full"
                                                    value={teacherSearchQuery}
                                                    onChange={(e) => handleSearchTeachers(e.target.value)}
                                                />
                                                {isSearchingTeachers && <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />}
                                            </div>

                                            {/* Teacher Search Results */}
                                            {teacherSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 max-h-60 overflow-y-auto">
                                                    {teacherSearchResults.map(teacher => (
                                                        <button
                                                            key={teacher.id}
                                                            onClick={() => handleAddTeacher(teacher.id)}
                                                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                                                                    {teacher.avatarUrl ? <img src={teacher.avatarUrl} alt={teacher.name || ''} className="w-full h-full object-cover" /> : (teacher.name?.[0] || 'P')}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-sm">{teacher.name}</p>
                                                                    <p className="text-xs text-slate-500">{teacher.email}</p>
                                                                </div>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Students Section */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" /> Listado General de Estudiantes
                                    </h3>
                                    {project.students && project.students.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {project.students.map((student, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                                                            {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name || ''} className="w-full h-full object-cover" /> : (student.name?.[0] || 'E')}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                            <p className="text-xs text-slate-500 truncate max-w-[120px]" title={student.email || ''}>{student.email}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Expulsar del proyecto"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No hay estudiantes vinculados aún.</p>
                                    )}

                                    {/* Smart Search for Adding Students */}
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <h4 className="font-bold text-slate-700 text-sm mb-3">Vincular Estudiante Existente</h4>
                                        <div className="relative">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                <Search className="w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre o correo..."
                                                    className="bg-transparent border-none outline-none text-sm w-full"
                                                    value={studentSearchQuery}
                                                    onChange={(e) => handleSearchStudents(e.target.value)}
                                                />
                                                {isSearchingStudents && <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {studentSearchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 max-h-60 overflow-y-auto">
                                                    {studentSearchResults.map(student => (
                                                        <button
                                                            key={student.id}
                                                            onClick={() => handleAddStudent(student.id)}
                                                            className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                                                                    {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover" /> : student.name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-700">{student.name}</p>
                                                                    <p className="text-[10px] text-slate-400">{student.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Plus className="w-4 h-4" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <EnrollmentControls projectId={project.id} initialAccessCode={(project as any).accessCode} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'RESOURCES' && (
                    // ... (existing resources content)

                    <div className="animate-in fade-in duration-500 space-y-12">
                        {/* Sección 1: Crear Nuevo Recurso (Full Width & Spacious) */}
                        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${editingResource ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                        {editingResource ? <Edit3 className="w-6 h-6 text-amber-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{editingResource ? 'Editar Material' : 'Añadir Nuevo Material'}</h3>
                                        <p className="text-slate-500 text-sm">{editingResource ? 'Modifica la información del recurso seleccionado.' : 'Sube archivos, enlaces o videos para enriquecer el proyecto.'}</p>
                                    </div>
                                </div>
                                {editingResource && (
                                    <button onClick={handleCancelEdit} type="button" className="text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <form action={async (formData) => {
                                setIsUploading(true);
                                try {
                                    let result;
                                    if (editingResource) {
                                        result = await updateProjectResourceAction(formData);
                                    } else if (resourceType === 'DRIVE' && driveMode === 'UPLOAD') {
                                        result = await uploadProjectFileToDriveAction(formData);
                                    } else if (resourceType === 'FILE') {
                                        result = await uploadProjectFileToR2Action(formData);
                                    } else {
                                        result = await addResourceToProjectAction(formData);
                                    }

                                    if (result?.success === false) {
                                        await showAlert("Error", `Error: ${result.error}`, "error");
                                    } else {
                                        if (editingResource) handleCancelEdit();
                                        else {
                                            setMetaTitle(''); setMetaPresentation(''); setMetaUtility(''); setMetaUrl(''); setSelectedDriveFile(null);
                                        }
                                    }
                                } catch (e: any) {
                                    await showAlert("Error", `Crash crítico: ${e.message || 'Error desconocido'}`, "error");
                                } finally {
                                    setIsUploading(false);
                                }
                            }} className="space-y-8">
                                <input type="hidden" name="projectId" value={project.id} />
                                {editingResource && <input type="hidden" name="resourceId" value={editingResource.id} />}

                                {/* Grid de Configuración Principal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Columna Izquierda: Tipo y Fuente */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Recurso</label>
                                            <div className="relative">
                                                <select name="type" value={resourceType} onChange={(e) => { setResourceType(e.target.value); if (e.target.value === 'DRIVE' && driveFiles.length === 0) handleFetchDriveFiles(); }}
                                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100"
                                                >
                                                    <option value="ARTICLE">📖 Artículo / Blog</option>
                                                    <option value="VIDEO">▶️ Video (YouTube/Vimeo)</option>
                                                    <option value="EMBED">✨ Embebido (Iframe)</option>
                                                    <option value="FILE">📂 Subir Archivo (Explorar)</option>
                                                    <option value="DRIVE">📁 Google Drive</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {resourceType === 'DRIVE' ? 'Contexto para IA' : 'Enlace / Fuente'}
                                                </label>
                                                <button
                                                    type="button"
                                                    disabled={isExtracting || (resourceType !== 'DRIVE' && !metaUrl && resourceType !== 'EMBED') || (resourceType === 'DRIVE' && !selectedDriveFile && !metaTitle)}
                                                    onClick={() => handleExtractMetadata()}
                                                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Wand2 className="w-3.5 h-3.5" />
                                                    {isExtracting ? 'Analizando...' : 'Autocompletar con IA'}
                                                </button>
                                            </div>

                                            {(resourceType === 'FILE') && (
                                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-white transition-colors cursor-pointer relative bg-slate-50">
                                                    <input type="file" name="file" required={resourceType === 'FILE' && !editingResource} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    <div className="pointer-events-none">
                                                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                                        <span className="text-xs text-slate-500 font-medium">Click para explorar archivos o arrastra aquí</span>
                                                    </div>
                                                </div>
                                            )}

                                            {resourceType === 'DRIVE' && !project.googleDriveFolderId && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-amber-800">No hay carpeta de Drive vinculada</h4>
                                                            <p className="text-xs text-amber-700 mt-1 mb-2">Para usar el explorador de archivos, debes vincular una carpeta de Google Drive a este proyecto.</p>

                                                            <div className="flex flex-col gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={isInitializingFolder}
                                                                    onClick={async () => {
                                                                        setIsInitializingFolder(true);
                                                                        try {
                                                                            const res = await initializeProjectDriveFolderAction(project.id);
                                                                            if (!res.success) {
                                                                                await showAlert("Error", res.error || 'Error al crear la carpeta', "error");
                                                                            }
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                            await showAlert("Error", 'Error inesperado', "error");
                                                                        } finally {
                                                                            setIsInitializingFolder(false);
                                                                        }
                                                                    }}
                                                                    className="w-fit px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                                                >
                                                                    {isInitializingFolder ? (
                                                                        <>
                                                                            <span className="w-3 h-3 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
                                                                            Creando carpeta...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Wand2 className="w-3 h-3" />
                                                                            Crear carpeta automáticamente
                                                                        </>
                                                                    )}
                                                                </button>

                                                                <Link href={`/dashboard/professor/projects/${project.id}/edit`} className="text-xs text-amber-600 hover:text-amber-800 underline w-fit">
                                                                    o configurar manualmente &rarr;
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {resourceType !== 'FILE' && (
                                                <div className="relative">
                                                    {resourceType === 'EMBED' ? (
                                                        <textarea name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required rows={4} placeholder="<iframe src='...'></iframe>" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                    ) : (
                                                        <>
                                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <input name="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} required={resourceType !== 'FILE'} type="url" placeholder={resourceType === 'DRIVE' ? "https://drive.google.com/..." : "https://ejemplo.com/recurso"} className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {resourceType === 'DRIVE' && project.googleDriveFolderId && (
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                                    <div className="flex p-1 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                        <button type="button" onClick={() => setDriveMode('LINK')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${driveMode === 'LINK' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Vincular Existente</button>
                                                        <button type="button" onClick={() => setDriveMode('UPLOAD')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${driveMode === 'UPLOAD' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Subir Nuevo</button>
                                                    </div>
                                                    {driveMode === 'LINK' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (driveFiles.length === 0) handleFetchDriveFiles();
                                                                    setIsDriveModalOpen(true);
                                                                }}
                                                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <Cloud className="w-5 h-5 text-blue-500" />
                                                                    {selectedDriveFile ? <span className="text-slate-900">{selectedDriveFile.title}</span> : <span className="text-slate-400">Explorar Archivos de Drive...</span>}
                                                                </span>
                                                                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">Seleccionar</span>
                                                            </button>
                                                            {selectedDriveFile && (
                                                                <button type="button" onClick={() => { setSelectedDriveFile(null); setMetaTitle(''); setMetaUrl(''); }} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-colors">
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-white transition-colors cursor-pointer relative">
                                                            <input type="file" name="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                                                            <div className="pointer-events-none">
                                                                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                                                <span className="text-xs text-slate-500 font-medium">Haz clic o arrastra un archivo aquí</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input type="hidden" name="url" value={selectedDriveFile?.url || metaUrl} />
                                                    <input type="hidden" name="driveTitle" value={selectedDriveFile?.title || ''} />
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {/* Hidden input to preserve URL/Key when editing FILE type */}
                                    {resourceType === 'FILE' && <input type="hidden" name="url" value={metaUrl} />}

                                    {/* Columna Derecha: Metadatos */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Recurso</label>
                                            <input name="title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} required placeholder="Ej: Guía completa de..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Presentación</label>
                                                <textarea name="presentation" value={metaPresentation} onChange={(e) => setMetaPresentation(e.target.value)} rows={3} placeholder="Breve intro..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Utilidad Pedagógica</label>
                                                <textarea name="utility" value={metaUtility} onChange={(e) => setMetaUtility(e.target.value)} rows={3} placeholder="¿Para qué sirve?" className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materia / Categoría</label>
                                                <input name="subject" value={metaSubject} onChange={(e) => setMetaSubject(e.target.value)} placeholder="Ej: Matemáticas, Innovación..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Competencia</label>
                                                <input name="competency" value={metaCompetency} onChange={(e) => setMetaCompetency(e.target.value)} placeholder="Ej: Pensamiento crítico..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Keywords <span className="text-[10px] font-normal normal-case opacity-60">(separadas por comas)</span>
                                            </label>
                                            <input name="keywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="Ej: innovación, diseño, proyecto..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Autor(es) / Entidad
                                            </label>
                                            <input name="citationAuthor" value={metaCitationAuthor} onChange={(e) => setMetaCitationAuthor(e.target.value)} placeholder="Ej: John Doe, Universidad X..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Referencia APA 7
                                            </label>
                                            <textarea name="apaReference" value={metaApaReference} onChange={(e) => setMetaApaReference(e.target.value)} rows={2} placeholder="Ej: Doe, J. (2023). Title..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <input
                                                type="checkbox"
                                                name="shouldEmbed"
                                                checked={metaShouldEmbed}
                                                onChange={(e) => setMetaShouldEmbed(e.target.checked)}
                                                value="true"
                                                id="shouldEmbedToggle"
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <label htmlFor="shouldEmbedToggle" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                                                Permitir visualización embebida (Iframe)
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button disabled={isUploading} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2">
                                        {isUploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : (editingResource ? 'Actualizar Recurso' : 'Publicar Recurso')}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Sección 2: Listados (Grid de Cards) */}
                        <div className="space-y-10">

                            {/* Lista de Recursos del Profesor */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Material de Apoyo</h3>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full">Curaduría</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {resources.length === 0 ? (
                                        <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <BookOpen className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h4 className="text-slate-900 font-bold mb-1">Tu biblioteca está vacía</h4>
                                            <p className="text-slate-500 text-sm">Añade los primeros recursos arriba.</p>
                                        </div>
                                    ) : resources.map((r) => (
                                        <div key={r.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col h-auto min-h-[14rem] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full z-0 opacity-50 transition-opacity group-hover:opacity-100 group-hover:from-blue-50" />

                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <ResourceIcon type={r.type} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{new Date(r.createdAt).toLocaleDateString()}</span>
                                                </div>

                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-1">{r.title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{r.type}</p>
                                                </div>

                                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                                    <button onClick={() => setViewerResource(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                                                        <Play className="w-3 h-3 fill-current" /> Ver
                                                    </button>
                                                    <button onClick={() => handleEditResource(r)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar recurso">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    {r.type !== 'EMBED' && (
                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="Abrir original">
                                                            <Maximize2 className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Contenido Sugerido (Learning Objects) */}
                            <section className="pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Objetos de Aprendizaje (OAs)
                                    </h3>
                                    <button
                                        onClick={() => setIsOAModalOpen(true)}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Vincular OA
                                    </button>
                                </div>

                                {learningObjects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {learningObjects.map((oa) => (
                                            <Link key={oa.id} href={`/dashboard/learning/object/${oa.id}`} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-center gap-4 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                                                <div className="p-3 bg-white rounded-lg border border-slate-100 group-hover:border-slate-200"><BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-700 text-sm truncate group-hover:text-slate-900">{oa.title}</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{oa.description}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 italic">No hay objetos de aprendizaje vinculados.</p>
                                        <button onClick={() => setIsOAModalOpen(true)} className="mt-2 text-xs font-bold text-indigo-500 hover:underline">Vincular uno ahora</button>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )
            }

            {/* Modal del Visor */}
            {
                viewerResource && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white w-full max-w-6xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <ResourceIcon type={viewerResource.type} />
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm leading-none">{viewerResource.title}</h3>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{viewerResource.type} • Publicado el {new Date(viewerResource.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewerResource(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <div className="flex-1 bg-black relative">
                                {viewerResource.type === 'VIDEO' ? (
                                    <iframe src={viewerResource.url.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                                ) : viewerResource.type === 'EMBED' ? (
                                    <div className="w-full h-full bg-white p-4 overflow-auto items-center justify-center flex" dangerouslySetInnerHTML={{ __html: viewerResource.url }} />
                                ) : (
                                    <iframe src={viewerResource.url.includes('drive.google.com') ? viewerResource.url.replace(/\/(view|edit).*$/, '/preview') : viewerResource.url} className="w-full h-full border-0 bg-white" title={viewerResource.title} />
                                )}
                            </div>
                            {(viewerResource.presentation || viewerResource.utility) && (
                                <div className="p-6 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[150px] overflow-auto">
                                    <div>
                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Presentación</h5>
                                        <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{viewerResource.presentation}&rdquo;</p>
                                    </div>
                                    <div>
                                        <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-blue-600">Utilidad Pedagógica</h5>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{viewerResource.utility || 'No especificada'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Otras pestañas (Placeholders) */}
            {/* Otras pestañas */}
            {
                activeTab === 'KANBAN' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <div className="p-2 bg-amber-100 ring-1 ring-amber-200 rounded-lg"><Sparkles className="w-4 h-4 text-amber-600" /></div>
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm">Automagía Activada</h4>
                                <p className="text-xs text-amber-700 mt-1">
                                    Las tareas que crees aquí con un <strong>Entregable</strong> definido generarán automáticamente un buzón de entrega para el estudiante.
                                </p>
                            </div>
                        </div>
                        <KanbanBoard projectId={project.id} userRole={session?.user?.role || ''} />
                    </div>
                )
            }
            {
                activeTab === 'MENTORSHIP' && (
                    <div className="animate-in fade-in duration-300">
                        <BookingList
                            defaultProjectId={project.id}
                            projectTeacherIds={project.teachers.map(t => t.id)}
                            projectStudents={session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN' ? project.students.map(s => ({ id: s.id, name: s.name || 'Sin nombre' })) : undefined}
                        />
                    </div>
                )
            }
            {
                activeTab === 'ASSIGNMENTS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="lg:col-span-1"><CreateAssignmentForm projectId={project.id} /></div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileCheck className="w-5 h-5 text-emerald-600" /> Entregas Recientes</h3>

                                {assignments.some(a => a.submissions.length > 0) && (
                                    <div className="relative z-20 w-full sm:w-auto">
                                        <select
                                            value={filterStudentId}
                                            onChange={(e) => setFilterStudentId(e.target.value)}
                                            className="w-full sm:w-auto appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 shadow-sm transition-all cursor-pointer hover:bg-slate-50"
                                        >
                                            <option value="ALL">Todos los Estudiantes</option>
                                            {project.students.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {assignments.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-500 font-medium">No hay entregables configurados aún.</p>
                                    </div>
                                ) : assignments.map(a => {
                                    // Filter submissions based on selection
                                    let filteredAssignment = a;

                                    if (filterStudentId !== 'ALL') {
                                        const studentSubmission = a.submissions.find((s: any) => s.student?.id === filterStudentId);
                                        filteredAssignment = {
                                            ...a,
                                            submissions: studentSubmission ? [studentSubmission] : []
                                        };
                                    }

                                    return (
                                        <SubmissionCard
                                            key={`${a.id}-${filterStudentId}`}
                                            assignment={filteredAssignment}
                                            projectStudents={project.students}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }
            {
                activeTab === 'RECOGNITIONS' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                        <div className="lg:col-span-1 space-y-6">
                            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        {editingRecognitionId ? 'Editar reconocimiento' : 'Nuevo reconocimiento'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Configura certificados o insignias con reglas automáticas según entregas y notas.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Tipo</label>
                                    <select
                                        value={recognitionType}
                                        onChange={(e) => setRecognitionType(e.target.value as 'CERTIFICATE' | 'BADGE')}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="BADGE">Insignia</option>
                                        <option value="CERTIFICATE">Certificado</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre</label>
                                    <input
                                        value={recognitionName}
                                        onChange={(e) => setRecognitionName(e.target.value)}
                                        placeholder="Ej: Insignia de excelencia"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Descripción</label>
                                    <textarea
                                        value={recognitionDescription}
                                        onChange={(e) => setRecognitionDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Texto visible para el estudiante"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Imagen (opcional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={recognitionImageUrl}
                                            onChange={(e) => setRecognitionImageUrl(e.target.value)}
                                            placeholder="URL o clave R2"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <label className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) await handleRecognitionAssetUpload(file, 'imageUrl');
                                                    e.target.value = '';
                                                }}
                                            />
                                            {uploadingRecognitionField === 'imageUrl' ? 'Subiendo...' : 'Subir'}
                                        </label>
                                    </div>
                                    {recognitionImageUrl && (
                                        <a
                                            href={resolveRecognitionAssetPreviewUrl(recognitionImageUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-blue-600 hover:underline"
                                        >
                                            Ver imagen configurada
                                        </a>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Plantilla visual avanzada</h4>
                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <input
                                                value={recognitionLogoUrl}
                                                onChange={(e) => setRecognitionLogoUrl(e.target.value)}
                                                placeholder="URL/logo key (opcional)"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            <label className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) await handleRecognitionAssetUpload(file, 'logoUrl');
                                                        e.target.value = '';
                                                    }}
                                                />
                                                {uploadingRecognitionField === 'logoUrl' ? 'Subiendo...' : 'Subir'}
                                            </label>
                                        </div>
                                        {recognitionLogoUrl && (
                                            <a
                                                href={resolveRecognitionAssetPreviewUrl(recognitionLogoUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                Ver logo
                                            </a>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <input
                                                value={recognitionBackgroundUrl}
                                                onChange={(e) => setRecognitionBackgroundUrl(e.target.value)}
                                                placeholder="URL/fondo key (opcional)"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            <label className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) await handleRecognitionAssetUpload(file, 'backgroundUrl');
                                                        e.target.value = '';
                                                    }}
                                                />
                                                {uploadingRecognitionField === 'backgroundUrl' ? 'Subiendo...' : 'Subir'}
                                            </label>
                                        </div>
                                        {recognitionBackgroundUrl && (
                                            <a
                                                href={resolveRecognitionAssetPreviewUrl(recognitionBackgroundUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                Ver fondo
                                            </a>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <input
                                                value={recognitionSignatureImageUrl}
                                                onChange={(e) => setRecognitionSignatureImageUrl(e.target.value)}
                                                placeholder="URL/firma key (opcional)"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            />
                                            <label className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) await handleRecognitionAssetUpload(file, 'signatureImageUrl');
                                                        e.target.value = '';
                                                    }}
                                                />
                                                {uploadingRecognitionField === 'signatureImageUrl' ? 'Subiendo...' : 'Subir'}
                                            </label>
                                        </div>
                                        {recognitionSignatureImageUrl && (
                                            <a
                                                href={resolveRecognitionAssetPreviewUrl(recognitionSignatureImageUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                Ver firma
                                            </a>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            value={recognitionSignatureName}
                                            onChange={(e) => setRecognitionSignatureName(e.target.value)}
                                            placeholder="Nombre firma"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                            value={recognitionSignatureRole}
                                            onChange={(e) => setRecognitionSignatureRole(e.target.value)}
                                            placeholder="Cargo firma"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Plantilla / texto base</label>
                                    <textarea
                                        value={recognitionTemplateBody}
                                        onChange={(e) => setRecognitionTemplateBody(e.target.value)}
                                        rows={4}
                                        placeholder="Contenido personalizado del certificado o de la insignia"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Condiciones de obtención</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={recognitionRequireAllAssignments}
                                                onChange={(e) => setRecognitionRequireAllAssignments(e.target.checked)}
                                                className="rounded border-slate-300"
                                            />
                                            Requiere todas las entregas
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={recognitionRequireAllGraded}
                                                onChange={(e) => setRecognitionRequireAllGraded(e.target.checked)}
                                                className="rounded border-slate-300"
                                            />
                                            Requiere todas las entregas calificadas
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            value={recognitionMinCompleted}
                                            onChange={(e) => setRecognitionMinCompleted(e.target.value)}
                                            type="number"
                                            min={0}
                                            placeholder="Mín. entregas"
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                            value={recognitionMinGraded}
                                            onChange={(e) => setRecognitionMinGraded(e.target.value)}
                                            type="number"
                                            min={0}
                                            placeholder="Mín. calificadas"
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                            value={recognitionMinAverageGrade}
                                            onChange={(e) => setRecognitionMinAverageGrade(e.target.value)}
                                            type="number"
                                            min={0}
                                            step="0.1"
                                            placeholder="Nota mínima"
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={recognitionAutoAward}
                                            onChange={(e) => setRecognitionAutoAward(e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        Otorgar automáticamente
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={recognitionIsActive}
                                            onChange={(e) => setRecognitionIsActive(e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        Configuración activa
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleSaveRecognitionConfig}
                                        disabled={isSavingRecognition}
                                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-sm transition disabled:opacity-60"
                                    >
                                        {isSavingRecognition ? 'Guardando...' : (editingRecognitionId ? 'Actualizar' : 'Crear reconocimiento')}
                                    </button>
                                    <button
                                        onClick={resetRecognitionForm}
                                        className="rounded-xl border border-slate-200 text-slate-700 font-bold px-4 py-2.5 text-sm hover:bg-slate-50 transition"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Reconocimientos configurados</h3>
                                        <p className="text-sm text-slate-500">
                                            Estos reconocimientos se vinculan automáticamente a las entregas y calificaciones del proyecto.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRecomputeRecognitions}
                                        disabled={isRecomputingRecognitions}
                                        className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-4 py-2 text-sm hover:bg-emerald-100 transition disabled:opacity-60"
                                    >
                                        {isRecomputingRecognitions ? 'Recalculando...' : 'Recalcular otorgamientos'}
                                    </button>
                                </div>
                            </section>

                            {recognitionConfigs.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium">Aún no hay certificados o insignias configurados.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recognitionConfigs.map((config) => (
                                        <article key={config.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg ${config.type === 'CERTIFICATE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {config.type === 'CERTIFICATE' ? 'Certificado' : 'Insignia'}
                                                        </span>
                                                        {!config.isActive && (
                                                            <span className="text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg bg-slate-200 text-slate-600">
                                                                Inactivo
                                                            </span>
                                                        )}
                                                        {config.autoAward && (
                                                            <span className="text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                                                                Auto
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-900">{config.name}</h4>
                                                    <p className="text-[11px] font-mono text-slate-500 break-all">ID único: {config.id}</p>
                                                    {config.description && (
                                                        <p className="text-sm text-slate-600">{config.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2">
                                                        {config.requireAllAssignments && (
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Todas las entregas</span>
                                                        )}
                                                        {config.requireAllGradedAssignments && (
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Todas calificadas</span>
                                                        )}
                                                        {config.minCompletedAssignments != null && (
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Min entregas: {config.minCompletedAssignments}</span>
                                                        )}
                                                        {config.minGradedAssignments != null && (
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Min calificadas: {config.minGradedAssignments}</span>
                                                        )}
                                                        {config.minAverageGrade != null && (
                                                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Nota mínima: {Number(config.minAverageGrade).toFixed(1)}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditRecognitionConfig(config)}
                                                        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecognitionConfig(config.id)}
                                                        className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-bold"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                                    Otorgados: {config._count?.awards || 0}
                                                </p>
                                                {config.awards.length > 0 ? (
                                                    <div className="mt-3 space-y-2">
                                                        {config.awards.slice(0, 5).map((award) => (
                                                            <div key={award.id} className={`text-xs rounded-lg px-3 py-2 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${award.isRevoked ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                                                <div className="min-w-0">
                                                                    <span className="truncate font-semibold">{award.student.name || award.student.email || 'Estudiante'}</span>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className="text-slate-400 whitespace-nowrap">{new Date(award.awardedAt).toLocaleDateString()}</span>
                                                                        {award.isRevoked && (
                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                                                <Ban className="w-3 h-3" /> Revocado
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {award.isRevoked && award.revokedReason && (
                                                                        <p className="text-[11px] mt-1 text-red-700 break-words">Motivo: {award.revokedReason}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <Link
                                                                        href={`/verify/recognition/${award.verificationCode}`}
                                                                        target="_blank"
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                                                                    >
                                                                        <ShieldCheck className="w-3 h-3" /> Verificar
                                                                    </Link>
                                                                    {!award.isRevoked && (
                                                                        <>
                                                                            <a
                                                                                href={`/api/recognitions/${award.id}/certificate`}
                                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                                                                            >
                                                                                <Download className="w-3 h-3" /> PDF
                                                                            </a>
                                                                            <button
                                                                                onClick={() => handleRevokeAward(award)}
                                                                                disabled={revokingAwardId === award.id}
                                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 font-bold disabled:opacity-60"
                                                                            >
                                                                                <Ban className="w-3 h-3" /> {revokingAwardId === award.id ? 'Revocando...' : 'Revocar'}
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-xs text-slate-500">Aún no hay estudiantes con este reconocimiento.</p>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            <OAPickerModal
                isOpen={isOAModalOpen}
                onClose={() => setIsOAModalOpen(false)}
                projectId={project.id}
            />

            <DriveSelectorModal
                isOpen={isDriveModalOpen}
                onClose={() => setIsDriveModalOpen(false)}
                files={driveFiles}
                onSelect={(file) => {
                    setSelectedDriveFile({ title: file.name, url: file.webViewLink! });
                    setMetaTitle(file.name);
                    setMetaUrl(file.webViewLink!);
                    setIsDriveModalOpen(false);
                    // Trigger AI analysis automatically
                    if (file.webViewLink) {
                        handleExtractMetadata(file.webViewLink, 'DRIVE');
                    }
                }}
                isLoading={isLoadingDrive}
            />

        </div >
    );
}
