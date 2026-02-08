import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { store, update } from '@/actions/App/Http/Controllers/WeightRecordController';

interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
}

interface WeightRecordFormProps {
    record?: WeightRecord;
    onSuccess?: () => void;
}

export default function WeightRecordForm({ record, onSuccess }: WeightRecordFormProps = {}) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        date: record?.date ? record.date.substring(0, 10) : new Date().toISOString().split('T')[0],
        time: record?.time.substring(0, 5) || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        weight_kg: record?.weight_kg || '',
    });

    const isEditing = !!record;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(update(record.id).url, {
                onSuccess: () => {
                    if (onSuccess) onSuccess();
                },
            });
        } else {
            post(store().url, {
                onSuccess: () => {
                    reset('weight_kg');
                    if (onSuccess) onSuccess();
                },
            });
        }
    };

    return (
        <Card className={isEditing ? 'border-0 shadow-none' : ''}>
            {!isEditing && (
                <CardHeader>
                    <CardTitle>Add Weight Record</CardTitle>
                    <CardDescription>Enter your weight details below.</CardDescription>
                </CardHeader>
            )}
            <CardContent className={isEditing ? 'p-0' : ''}>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            <InputError message={errors.date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                                id="time"
                                type="time"
                                value={data.time}
                                onChange={(e) => setData('time', e.target.value)}
                                required
                            />
                            <InputError message={errors.time} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weight_kg">Weight (kg)</Label>
                            <Input
                                id="weight_kg"
                                type="number"
                                step="0.01"
                                placeholder="00.00"
                                value={data.weight_kg}
                                onChange={(e) => setData('weight_kg', e.target.value)}
                                required
                            />
                            <InputError message={errors.weight_kg} />
                        </div>
                    </div>

                    <Button type="submit" disabled={processing}>
                        {isEditing ? 'Update Record' : 'Add Record'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
