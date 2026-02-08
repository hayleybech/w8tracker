import { Head } from '@inertiajs/react';
import WeightChart from '@/components/weight-chart';
import WeightRecordForm from '@/components/weight-record-form';
import WeightRecordList from '@/components/weight-record-list';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
    created_at: string;
}

interface DashboardProps {
    weightRecords: WeightRecord[];
}

export default function Dashboard({ weightRecords }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <WeightChart records={weightRecords} />
                <WeightRecordForm />
                <WeightRecordList records={weightRecords} />
            </div>
        </AppLayout>
    );
}
