import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
}

interface WeightChartProps {
    records: WeightRecord[];
}

export default function WeightChart({ records }: WeightChartProps) {
    const chartData = useMemo(() => {
        if (!records || records.length === 0) return [];

        // Sort records by date and time ascending
        const sortedRecords = [...records].sort((a, b) => {
            const dateA = new Date(`${a.date.substring(0, 10)}T${a.time}`);
            const dateB = new Date(`${b.date.substring(0, 10)}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

        // Map to keep the latest record per day
        const dailyDataMap = new Map<string, number>();
        sortedRecords.forEach((record) => {
            const dateStr = record.date.substring(0, 10);
            dailyDataMap.set(dateStr, Number(record.weight_kg));
        });

        // Convert map back to array for Recharts
        return Array.from(dailyDataMap.entries()).map(([date, weight]) => ({
            date,
            weight,
        }));
    }, [records]);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Weight Progress</CardTitle>
                    <CardDescription>No data available to display the graph.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>Your weight trend over time (one point per day).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#2563eb"
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
