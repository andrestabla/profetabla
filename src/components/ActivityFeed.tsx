import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Upload, MessageSquare, AlertCircle } from 'lucide-react';

interface Activity {
    id: string;
    user: { name: string; avatarUrl: string | null };
    action: string;
    description: string;
    createdAt: string;
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
    const getIcon = (action: string) => {
        if (action.includes('UPLOAD')) return <Upload className="w-4 h-4 text-blue-500" />;
        if (action.includes('TASK')) return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (action.includes('COMMENT')) return <MessageSquare className="w-4 h-4 text-purple-500" />;
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-lg">Actividad Reciente</h3>
            <div className="space-y-0 relative border-l-2 border-slate-100 ml-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="mb-6 ml-6 relative">
                        <span className="absolute -left-[33px] bg-white border border-slate-200 p-1.5 rounded-full">
                            {getIcon(activity.action)}
                        </span>
                        <div>
                            <p className="text-sm text-slate-800">
                                <span className="font-bold">{activity.user.name || 'Usuario'}</span> {activity.description}
                            </p>
                            <span className="text-xs text-slate-400 block mt-1">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
