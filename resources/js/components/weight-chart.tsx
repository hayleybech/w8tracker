import { useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface WeightRecord {
    id: number;
    date: string;
    time: string;
    weight_kg: string | number;
}

interface WeightChartProps {
    records: WeightRecord[];
}

type ViewMode = 'day' | 'month' | 'year' | 'all' | 'custom';

export default function WeightChart({ records }: WeightChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const chartData = useMemo(() => {
        if (!records || records.length === 0) return [];

        // Sort records by date and time ascending
        const sortedRecords = [...records].sort((a, b) => {
            const dateA = new Date(`${a.date.substring(0, 10)}T${a.time}`);
            const dateB = new Date(`${b.date.substring(0, 10)}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });

        let filteredRecords = sortedRecords;
        const now = new Date();

        if (viewMode === 'day') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            filteredRecords = sortedRecords.filter(r => new Date(r.date) >= thirtyDaysAgo);
        } else if (viewMode === 'month') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            filteredRecords = sortedRecords.filter(r => new Date(r.date) >= oneYearAgo);
        } else if (viewMode === 'year') {
            // No additional filter for year, show all but aggregate by year later
        } else if (viewMode === 'custom') {
            if (startDate) filteredRecords = filteredRecords.filter(r => r.date >= startDate);
            if (endDate) filteredRecords = filteredRecords.filter(r => r.date <= endDate);
        }

        if (filteredRecords.length === 0) return [];

        if (viewMode === 'month') {
            const monthlyDataMap = new Map<string, { total: number, count: number }>();
            filteredRecords.forEach((record) => {
                const monthStr = record.date.substring(0, 7); // YYYY-MM
                const current = monthlyDataMap.get(monthStr) || { total: 0, count: 0 };
                monthlyDataMap.set(monthStr, {
                    total: current.total + Number(record.weight_kg),
                    count: current.count + 1
                });
            });

            return Array.from(monthlyDataMap.entries()).map(([date, data]) => ({
                date,
                weight: data.total / data.count,
            })).sort((a, b) => a.date.localeCompare(b.date));
        }

        if (viewMode === 'year') {
            const yearlyDataMap = new Map<string, { total: number, count: number }>();
            filteredRecords.forEach((record) => {
                const yearStr = record.date.substring(0, 4); // YYYY
                const current = yearlyDataMap.get(yearStr) || { total: 0, count: 0 };
                yearlyDataMap.set(yearStr, {
                    total: current.total + Number(record.weight_kg),
                    count: current.count + 1
                });
            });

            return Array.from(yearlyDataMap.entries()).map(([date, data]) => ({
                date,
                weight: data.total / data.count,
            })).sort((a, b) => a.date.localeCompare(b.date));
        }

        // Daily or Custom/All (Daily points)
        const dailyDataMap = new Map<string, number>();
        filteredRecords.forEach((record) => {
            const dateStr = record.date.substring(0, 10);
            dailyDataMap.set(dateStr, Number(record.weight_kg));
        });

        const dates = Array.from(dailyDataMap.keys()).sort();
        if (dates.length === 0) return [];

        const start = new Date(dates[0]);
        const end = new Date(dates[dates.length - 1]);
        const data = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().substring(0, 10);
            const weight = dailyDataMap.get(dateStr);
            if (weight !== undefined || viewMode === 'day' || viewMode === 'custom') {
                 data.push({
                    date: dateStr,
                    weight: weight ?? null,
                });
            }
        }

        return data;
    }, [records, viewMode, startDate, endDate]);

    const formatXAxis = (str: string) => {
        const date = new Date(str);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTooltipLabel = (label: string) => {
        const date = new Date(label);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return date.toLocaleDateString();
    };

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle>Weight Progress</CardTitle>
                    <CardDescription>Your weight trend over time.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {viewMode === 'custom' && (
                        <div className="flex items-center gap-2 mr-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-8 w-32"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-8 w-32"
                            />
                        </div>
                    )}
                    <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                        <SelectTrigger className="h-8 w-[120px]">
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
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        No data available for the selected period.
                    </div>
                ) : (
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
                                    tickFormatter={formatXAxis}
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
                                    labelFormatter={formatTooltipLabel}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: number) => [Number(value).toFixed(1) + ' kg', 'Weight']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#2563eb"
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
