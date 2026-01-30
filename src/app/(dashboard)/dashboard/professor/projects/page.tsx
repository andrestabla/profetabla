import { FilteredProjectList } from '@/components/FilteredProjectList';

export const dynamic = 'force-dynamic';

export default function ProfessorProjectsPage() {
    return (
        <FilteredProjectList
            type="PROJECT"
            title="Proyectos (ABP)"
            description="Gestiona tus proyectos pedagógicos y el progreso de tus estudiantes."
            createLink="/dashboard/professor/projects/new"
            emptyMessage="Aún no tienes proyectos"
            emptySubMessage="Crea un proyecto bajo la metodología ABP para guiar a tus estudiantes."
            createLabel="Nuevo Proyecto"
        />
    );
}
