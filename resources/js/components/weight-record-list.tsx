import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from '@inertiajs/react';
import { Trash2, Edit2 } from 'lucide-react';
import { destroy } from "@/routes/weight-records";
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WeightRecordForm from './weight-record-form';

interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
    created_at: string;
}

interface WeightRecordListProps {
    records: WeightRecord[];
}

export default function WeightRecordList({ records }: WeightRecordListProps) {
    const form = useForm();
    const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this record?')) {
            form.delete(destroy(id));
        }
    };

    if (records.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Weight Records</CardTitle>
                    <CardDescription>You haven't added any weight records yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weight Records</CardTitle>
                <CardDescription>A history of your weight measurements.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-neutral-500 dark:text-neutral-400">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                                <th className="px-4 py-3 font-medium text-right">Weight (kg)</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{record.time.substring(0, 5)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{record.weight_kg}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingRecord(record)}
                                                disabled={form.processing}
                                                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                                            >
                                                <Edit2 className="size-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(record.id)}
                                                disabled={form.processing}
                                                className="text-neutral-400 hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Weight Record</DialogTitle>
                        <DialogDescription>Update your weight details below.</DialogDescription>
                    </DialogHeader>
                    {editingRecord && (
                        <WeightRecordForm
                            record={editingRecord}
                            onSuccess={() => setEditingRecord(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
