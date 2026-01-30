import { FilteredProjectList } from '@/components/FilteredProjectList';

export const dynamic = 'force-dynamic';

export default function ProfessorChallengesPage() {
    return (
        <FilteredProjectList
            type="CHALLENGE"
            title="Retos (ABR)"
            description="Gestiona tus retos de aprendizaje (ABR) basados en el entorno."
            createLink="/dashboard/professor/projects/new?type=CHALLENGE"
            emptyMessage="Aún no tienes retos"
            emptySubMessage="Crea un reto social o comunitario para involucrar a tus estudiantes."
            createLabel="Nuevo Reto"
        />
    );
}
