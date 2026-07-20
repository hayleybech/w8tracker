import { useMemo, useState } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ChartDataItem {
    date: string;
    weight: number | null;
    forecast50?: number;
    p10?: number;
    p90?: number;
    p25?: number;
    p75?: number;
    isForecast?: boolean;
}

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

        let baseData: ChartDataItem[] = [];

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

            baseData = Array.from(monthlyDataMap.entries()).map(([date, data]) => ({
                date,
                weight: data.total / data.count,
            })).sort((a, b) => a.date.localeCompare(b.date));
        } else if (viewMode === 'year') {
            const yearlyDataMap = new Map<string, { total: number, count: number }>();
            filteredRecords.forEach((record) => {
                const yearStr = record.date.substring(0, 4); // YYYY
                const current = yearlyDataMap.get(yearStr) || { total: 0, count: 0 };
                yearlyDataMap.set(yearStr, {
                    total: current.total + Number(record.weight_kg),
                    count: current.count + 1
                });
            });

            baseData = Array.from(yearlyDataMap.entries()).map(([date, data]) => ({
                date,
                weight: data.total / data.count,
            })).sort((a, b) => a.date.localeCompare(b.date));
        } else {
            // Daily or Custom/All (Daily points)
            const dailyDataMap = new Map<string, number>();
            filteredRecords.forEach((record) => {
                const dateStr = record.date.substring(0, 10);
                dailyDataMap.set(dateStr, Number(record.weight_kg));
            });

            const dates = Array.from(dailyDataMap.keys()).sort();
            if (dates.length > 0) {
                const start = new Date(dates[0]);
                const end = new Date(dates[dates.length - 1]);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().substring(0, 10);
                    const weight = dailyDataMap.get(dateStr);
                    if (weight !== undefined || viewMode === 'day' || viewMode === 'custom') {
                        baseData.push({
                            date: dateStr,
                            weight: weight ?? null,
                        });
                    }
                }
            }
        }

        // --- Monte Carlo Forecast ---
        if (sortedRecords.length < 2) return baseData;

        // Calculate daily changes from ALL records to have a better distribution
        const dailyChanges: number[] = [];
        for (let i = 1; i < sortedRecords.length; i++) {
            const date1 = new Date(sortedRecords[i - 1].date);
            const date2 = new Date(sortedRecords[i].date);
            const daysDiff = Math.max(1, Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)));
            const weightDiff = Number(sortedRecords[i].weight_kg) - Number(sortedRecords[i - 1].weight_kg);
            dailyChanges.push(weightDiff / daysDiff);
        }

        if (dailyChanges.length === 0) return baseData;

        const mean = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
        const stdDev = Math.sqrt(dailyChanges.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / dailyChanges.length);

        const lastRecord = sortedRecords[sortedRecords.length - 1];
        const lastDate = new Date(lastRecord.date);
        const lastWeight = Number(lastRecord.weight_kg);

        let forecastDays = 30;
        if (viewMode === 'month') {
            forecastDays = 365;
        } else if (viewMode === 'year' || viewMode === 'all') {
            // Calculate span of data
            const firstDate = new Date(sortedRecords[0].date);
            const totalDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
            forecastDays = Math.max(30, totalDays);
        } else if (viewMode === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            forecastDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }

        const numSimulations = 500;
        const simulations: number[][] = [];

        for (let s = 0; s < numSimulations; s++) {
            const simulation: number[] = [lastWeight];
            for (let d = 1; d <= forecastDays; d++) {
                // Box-Muller transform for normal distribution
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                const change = mean + z0 * stdDev;
                simulation.push(simulation[simulation.length - 1] + change);
            }
            simulations.push(simulation);
        }

        const getPercentile = (data: number[], percentile: number) => {
            const sorted = [...data].sort((a, b) => a - b);
            const index = Math.floor((percentile / 100) * sorted.length);
            return sorted[index];
        };

        const forecastData = [];
        for (let d = 1; d <= forecastDays; d++) {
            const dayWeights = simulations.map(s => s[d]);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + d);

            forecastData.push({
                date: nextDate.toISOString().substring(0, 10),
                weight: null,
                forecast50: getPercentile(dayWeights, 50),
                p10: getPercentile(dayWeights, 10),
                p90: getPercentile(dayWeights, 90),
                p25: getPercentile(dayWeights, 25),
                p75: getPercentile(dayWeights, 75),
                isForecast: true,
            });
        }

        // Join the last real point with the forecast to avoid gaps in Recharts
        if (baseData.length > 0) {
            const lastBasePoint = baseData[baseData.length - 1];
            if (lastBasePoint.date === lastRecord.date.substring(0, 10)) {
                lastBasePoint.forecast50 = lastWeight;
                lastBasePoint.p10 = lastWeight;
                lastBasePoint.p90 = lastWeight;
                lastBasePoint.p25 = lastWeight;
                lastBasePoint.p75 = lastWeight;
            }
        }

        return [...baseData, ...forecastData];
    }, [records, viewMode, startDate, endDate]);

    const formatXAxis = (str: string) => {
        const date = new Date(str);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTooltipLabel = (label: React.ReactNode) => {
        if (typeof label !== 'string') {
            return label;
        }
        const date = new Date(label);
        if (viewMode === 'year') return date.getFullYear().toString();
        if (viewMode === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        return date.toLocaleDateString();
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
                                    <linearGradient
                                        id="colorWeight"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#2563eb"
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#2563eb"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
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
                                    labelStyle={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--foreground)',
                                        fontWeight: 'bold',
                                    }}
                                    itemStyle={{ color: 'var(--foreground)', fontSize: 'var(--text-xs)' }}
                                    contentStyle={{
                                        borderRadius: '5px',
                                        border: '1px solid var(--muted-foreground)',
                                        padding: '5px 8px',
                                        lineHeight: '1.2em',
                                        backgroundColor: 'var(--muted)',
                                    }}
                                    formatter={(value: number | undefined, name: string) => {
                                        if (value === undefined || value === null) return ['N/A', name];
                                        const formattedValue = Number(value).toFixed(1) + ' kg';

                                        const labels: Record<string, string> = {
                                            weight: 'Weight',
                                            forecast50: 'Forecast (Median)',
                                            p10: '90% Confidence (Lower)',
                                            p90: '90% Confidence (Upper)',
                                            p25: '50% Confidence (Lower)',
                                            p75: '50% Confidence (Upper)',
                                        };

                                        return [formattedValue, labels[name] || name];
                                    }}
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
                                <Area
                                    type="monotone"
                                    dataKey="forecast50"
                                    stroke="#2563eb"
                                    strokeDasharray="5 5"
                                    fill="none"
                                    strokeWidth={2}
                                    connectNulls
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p90"
                                    stroke="none"
                                    fill="#2563eb"
                                    fillOpacity={0.05}
                                    baseValue="p10"
                                    connectNulls
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p75"
                                    stroke="none"
                                    fill="#2563eb"
                                    fillOpacity={0.1}
                                    baseValue="p25"
                                    connectNulls
                                />
                                <ReferenceLine x={records[records.length - 1]?.date} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
