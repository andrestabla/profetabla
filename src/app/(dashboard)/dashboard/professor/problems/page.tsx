import { FilteredProjectList } from '@/components/FilteredProjectList';

export const dynamic = 'force-dynamic';

export default function ProfessorProblemsPage() {
    return (
        <FilteredProjectList
            type="PROBLEM"
            title="Problemas (ABP)"
            description="Gestiona tus problemas de aprendizaje (ABP) para análisis crítico."
            createLink="/dashboard/professor/projects/new?type=PROBLEM"
            emptyMessage="Aún no tienes problemas"
            emptySubMessage="Crea un escenario o problema complejo para análisis."
            createLabel="Nuevo Problema"
        />
    );
}
