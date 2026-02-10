'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react';
import { saveRubricAction } from '@/app/actions/rubric-actions';
import { useModals } from '@/components/ModalProvider';

type RubricItem = {
    id?: string;
    criterion: string;
    maxPoints: number;
    order: number;
};

export function RubricEditor({ assignmentId, initialItems = [], onClose }: { assignmentId: string; initialItems?: RubricItem[]; onClose: () => void }) {
    const { showAlert, showConfirm } = useModals();
    const [items, setItems] = useState<RubricItem[]>(initialItems.sort((a, b) => a.order - b.order));
    const [isSaving, setIsSaving] = useState(false);

    const addItem = () => {
        setItems([...items, { criterion: '', maxPoints: 10, order: items.length }]);
    };

    const updateItem = (index: number, field: keyof RubricItem, value: string | number) => {
        const newItems = [...items];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const deleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Ensure order is correct
        const orderedItems = items.map((item, index) => ({ ...item, order: index }));

        const res = await saveRubricAction(assignmentId, orderedItems);
        if (res.success) {
            await showAlert("Rúbrica Guardada", "Los criterios de evaluación han sido actualizados correctamente.", "success");
            onClose();
        } else {
            await showAlert("Error", "No se pudo guardar la rúbrica: " + res.error, "error");
        }
        setIsSaving(false);
    };

    const totalPoints = items.reduce((sum, item) => sum + (Number(item.maxPoints) || 0), 0);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex justify-between items-center">
                <span>Editor de Rúbrica</span>
                <span className={`text-sm px-3 py-1 rounded-full font-bold ${totalPoints === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    Total: {totalPoints} pts
                </span>
            </h3>

            <div className="space-y-3 mb-6">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                        <div className="pt-2 text-slate-400 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={item.criterion}
                                onChange={(e) => updateItem(index, 'criterion', e.target.value)}
                                placeholder="Descripción del criterio (ej: Ortografía)"
                                className="w-full text-sm border-slate-200 rounded-md focus:ring-blue-500 mb-2"
                            />
                        </div>
                        <div className="w-20">
                            <input
                                type="number"
                                value={item.maxPoints}
                                onChange={(e) => updateItem(index, 'maxPoints', parseInt(e.target.value) || 0)}
                                className="w-full text-sm border-slate-200 rounded-md focus:ring-blue-500 text-center font-bold"
                            />
                        </div>
                        <button onClick={async () => {
                            const confirm = await showConfirm("¿Eliminar criterio?", "¿Estás seguro de que deseas eliminar este criterio de la rúbrica?", "danger");
                            if (confirm) deleteItem(index);
                        }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={addItem}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-200"
                >
                    <Plus className="w-4 h-4" /> Añadir Criterio
                </button>

                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Rúbrica
                    </button>
                </div>
            </div>
        </div>
    );
}
