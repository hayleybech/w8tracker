import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { store } from '@/actions/App/Http/Controllers/WeightRecordController';

export default function WeightRecordForm() {
    const { data, setData, post, processing, errors, reset } = useForm({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        weight_kg: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store().url, {
            onSuccess: () => reset('weight_kg'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add Weight Record</CardTitle>
                <CardDescription>Enter your weight details below.</CardDescription>
            </CardHeader>
            <CardContent>
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
                        Add Record
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
