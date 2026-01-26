import { ResourceList } from '@/components/ResourceList';
import { BookOpen } from 'lucide-react';

export default function LearningPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    Biblioteca de Aprendizaje
                </h1>
                <p className="text-slate-500 mt-2">
                    Recursos seleccionados, tutoriales y documentación para potenciar tu proyecto.
                </p>
            </div>

            <ResourceList />
        </div>
    );
}
