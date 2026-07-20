import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type WeightRecord } from '@/types';

interface WeightChartProps {
    records: WeightRecord[];
}

type ViewMode = 'day' | 'month' | 'year' | 'all' | 'custom';

export default function WeightChart({ records }: WeightChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const chartData = useMemo(() => {
        if (!records || records.length === 0) {
            return [];
        }

        // Sort records by date and time ascending
        const sortedRecords = [...records].sort((a, b) => {
            const dateA = new Date(`${a.date.substring(0, 10)}T${a.time}`);
            const dateB = new Date(`${b.date.substring(0, 10)}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

        const now = new Date();
        let filteredRecords = sortedRecords;

        if (viewMode === 'day') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            filteredRecords = sortedRecords.filter((r) => new Date(r.date) >= thirtyDaysAgo);
        } else if (viewMode === 'month') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            filteredRecords = sortedRecords.filter((r) => new Date(r.date) >= oneYearAgo);
        } else if (viewMode === 'custom') {
            if (startDate) {
                filteredRecords = filteredRecords.filter((r) => r.date >= startDate);
            }
            if (endDate) {
                filteredRecords = filteredRecords.filter((r) => r.date <= endDate);
            }
        }

        if (filteredRecords.length === 0) {
            return [];
        }

        const aggregateData = (records: WeightRecord[], keyFn: (r: WeightRecord) => string, dateFn: (key: string) => number) => {
            const dataMap = new Map<string, { total: number; count: number }>();
            records.forEach((record) => {
                const key = keyFn(record);
                const current = dataMap.get(key) || { total: 0, count: 0 };
                dataMap.set(key, {
                    total: current.total + Number(record.weight_kg),
                    count: current.count + 1,
                });
            });

            return Array.from(dataMap.entries())
                .map(([key, data]) => ({
                    date: dateFn(key),
                    weight: data.total / data.count,
                }))
                .sort((a, b) => a.date - b.date);
        };

        if (viewMode === 'month') {
            return aggregateData(
                filteredRecords,
                (r) => r.date.substring(0, 7), // YYYY-MM
                (key) => new Date(`${key}-01T00:00:00`).getTime(),
            );
        }

        if (viewMode === 'year') {
            return aggregateData(
                filteredRecords,
                (r) => r.date.substring(0, 4), // YYYY
                (key) => new Date(`${key}-01-01T00:00:00`).getTime(),
            );
        }

        // Daily or Custom/All (Daily points)
        return filteredRecords.map((record) => ({
            date: new Date(`${record.date.substring(0, 10)}T${record.time}`).getTime(),
            weight: Number(record.weight_kg),
        }));
    }, [records, viewMode, startDate, endDate]);

    const formatXAxis = (timestamp: number) => {
        const date = new Date(timestamp);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTooltipLabel = (label: string | number) => {
        const timestamp = typeof label === 'number' ? label : Number(label);
        if (isNaN(timestamp)) return label;

        const date = new Date(timestamp);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return date.toLocaleString();
    };

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-7 sm:flex-row sm:items-center">
                <div>
                    <CardTitle>Weight Progress</CardTitle>
                    <CardDescription>
                        Your weight trend over time.
                    </CardDescription>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Select
                        value={viewMode}
                        onValueChange={(value: ViewMode) => setViewMode(value)}
                    >
                        <SelectTrigger className="h-8 w-38">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Last 30 Days</SelectItem>
                            <SelectItem value="month">Last Year</SelectItem>
                            <SelectItem value="year">By Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {viewMode === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Input
                                name="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 w-34.5 text-sm"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    to
                                </span>
                                <Input
                                    name="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 w-34.5 text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="flex h-75 items-center justify-center text-muted-foreground">
                        No data available for the selected period.
                    </div>
                ) : (
                    <div className="h-75 w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 0,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-chart-main)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--color-chart-main)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatXAxis}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    scale="time"
                                    stroke="var(--color-muted-foreground)"
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['dataMin - 5', 'dataMax + 5']}
                                    stroke="var(--color-muted-foreground)"
                                    tickFormatter={(value) => `${value} kg`}
                                />
                                <Tooltip
                                    labelFormatter={formatTooltipLabel}
                                    labelStyle={{
                                        fontSize: '12px',
                                        color: 'var(--color-foreground)',
                                        fontWeight: 'bold',
                                    }}
                                    itemStyle={{ color: 'var(--color-foreground)', fontSize: '12px' }}
                                    contentStyle={{
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        padding: '8px',
                                        lineHeight: '1.2em',
                                        backgroundColor: 'var(--color-card)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                    formatter={(value: number | undefined) => [
                                        value !== undefined ? Number(value).toFixed(1) + ' kg' : 'N/A',
                                        'Weight',
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--color-chart-main)"
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                    strokeWidth={2}
                                    connectNulls
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
