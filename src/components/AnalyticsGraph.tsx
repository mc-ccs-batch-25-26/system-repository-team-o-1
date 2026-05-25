import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getCategoryPerformanceData, CategoryPerformance } from '../firebase/analyticsService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsGraphProps {
    isDarkMode: boolean;
}

/* ─── Skeleton shimmer rows ──────────────────────────────────────────────── */
const SkeletonBars = () => (
    <div className="space-y-4 py-2">
        {[75, 55, 90, 42, 68].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
                <div className="w-28 h-3 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0 animate-pulse" />
                <div
                    className="h-4 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                />
            </div>
        ))}
    </div>
);

/* ─── Empty state ────────────────────────────────────────────────────────── */
const EmptyGraph = ({ isDarkMode }: { isDarkMode: boolean }) => (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="flex items-end gap-1.5 opacity-20">
            {[40, 65, 30, 80, 55].map((h, i) => (
                <div
                    key={i}
                    className="w-7 rounded-sm bg-zinc-400 dark:bg-zinc-500"
                    style={{ height: `${h}px` }}
                />
            ))}
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No quiz data yet — take a quiz to see your analytics.
        </p>
    </div>
);

/* ─── main component ─────────────────────────────────────────────────────── */
const AnalyticsGraph: React.FC<AnalyticsGraphProps> = ({ isDarkMode }) => {
    const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await getCategoryPerformanceData();
            setCategoryData(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <SkeletonBars />;

    const filteredData = categoryData.filter(c => c.regularAnswered > 0);
    if (filteredData.length === 0) return <EmptyGraph isDarkMode={isDarkMode} />;

    /* ── colour ramp: score → hue ───────────────────────────────────────── */
    const getBarColor = (accuracy: number) => {
        if (accuracy >= 70) return isDarkMode ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)';
        if (accuracy >= 40) return isDarkMode ? 'rgba(251, 191, 36, 0.85)' : 'rgba(245, 158, 11, 0.85)';
        return isDarkMode ? 'rgba(251, 113, 133, 0.85)' : 'rgba(244, 63, 94, 0.82)';
    };

    const bgColors  = filteredData.map(r => getBarColor(r.regularAccuracy));
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDarkMode ? '#a1a1aa' : '#71717a';

    const chartData = {
        labels: filteredData.map(r => r.categoryName),
        datasets: [
            {
                label: 'Accuracy (%)',
                data: filteredData.map(r => r.regularAccuracy),
                backgroundColor: bgColors,
                hoverBackgroundColor: bgColors.map(c => c.replace(/[\d.]+\)$/, '1)')),
                borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 6, bottomRight: 6 },
                borderSkipped: false,
                barThickness: 16,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' as const },
        plugins: {
            legend: { display: false },
            title:  { display: false },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.98)',
                titleColor: isDarkMode ? '#fff' : '#18181b',
                bodyColor:  isDarkMode ? '#a1a1aa' : '#52525b',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (ctx: any) => {
                        const r = filteredData[ctx.dataIndex];
                        return ` ${r.regularCorrect}/${r.regularAnswered} correct — ${r.regularAccuracy}% accuracy`;
                    },
                },
            },
        },
        scales: {
            x: {
                min: 0,
                max: 100,
                grid: { color: gridColor, drawBorder: false },
                ticks: {
                    color: textColor,
                    font: { family: "'Inter', sans-serif", size: 11 },
                    callback: (v: any) => `${v}%`,
                },
                border: { display: false },
            },
            y: {
                grid:  { display: false },
                ticks: {
                    color: isDarkMode ? '#e4e4e7' : '#3f3f46',
                    font: { family: "'Inter', sans-serif", weight: '500' as const, size: 12 },
                    autoSkip: false,
                },
                border: { display: false },
            },
        },
        layout: { padding: { left: 0, right: 12, top: 0, bottom: 0 } },
    };

    /* dynamic chart height so it never feels squashed */
    const chartHeight = Math.max(220, filteredData.length * 44);

    return (
        <div style={{ height: chartHeight }}>
            <Bar data={chartData} options={options as any} />
        </div>
    );
};

export default AnalyticsGraph;