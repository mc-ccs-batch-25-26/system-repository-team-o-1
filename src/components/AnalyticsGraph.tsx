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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface AnalyticsGraphProps {
    isDarkMode: boolean;
}

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (categoryData.length === 0) {
        return (
            <div className={`flex justify-center items-center h-64 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <p>No quiz data available yet. Take a quiz to see your analytics!</p>
            </div>
        );
    }

    const barColor = isDarkMode ? 'rgba(74, 222, 128, 0.9)' : 'rgba(22, 163, 74, 0.9)';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDarkMode ? '#e4e4e7' : '#3f3f46';

    const chartData = {
        labels: categoryData.map(record => record.categoryName),
        datasets: [
            {
                label: 'Accuracy (%)',
                data: categoryData.map(record => record.accuracy),
                backgroundColor: barColor,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 20,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDarkMode ? '#fff' : '#000',
                bodyColor: isDarkMode ? '#a1a1aa' : '#52525b',
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => {
                        const index = context.dataIndex;
                        const record = categoryData[index];
                        return ` ${record.totalCorrect}/${record.totalAnswered} Correct (${record.accuracy}%)`;
                    }
                }
            }
        },
        scales: {
            x: {
                min: 0,
                max: 100,
                grid: {
                    color: gridColor,
                    drawBorder: false,
                },
                ticks: {
                    color: isDarkMode ? '#a1a1aa' : '#71717a',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                },
                border: {
                    display: false
                }
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: textColor,
                    font: {
                        family: "'Inter', sans-serif",
                        weight: '500',
                        size: 12
                    },
                    autoSkip: false,
                },
                border: {
                    display: false
                }
            },
        },
        layout: {
            padding: {
                left: 0,
                right: 20,
                top: 0,
                bottom: 0
            }
        }
    };

    return (
        <div className="w-full h-80">
            <Bar data={chartData} options={options as any} />
        </div>
    );
};

export default AnalyticsGraph;