import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Assessment as AssessmentIcon,
    Build as BuildIcon,
    Whatshot as WhatshotIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import ErrorService from '../services/errorService';
import ThemeService from '../services/themeService';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/dashboard/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Dashboard verisi alınamadı');
            }

            const data = await response.json();
            if (data.success) {
                setSummary(data.summary);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            const processedError = await ErrorService.handleApiError(err, 'Dashboard');
            setError(processedError);
        } finally {
            setLoading(false);
        }
    };

    const getModuleIcon = (module) => {
        switch (module) {
            case 'fire':
                return '🚨';
            case 'energy':
                return '⚡';
            case 'hvac':
                return '🌡️';
            default:
                return '🔧';
        }
    };

    const getModuleName = (module) => {
        switch (module) {
            case 'fire':
                return 'YANGIN';
            case 'energy':
                return 'ENERJİ';
            case 'hvac':
                return 'HVAC';
            default:
                return module.toUpperCase();
        }
    };

    const prepareChartData = () => {
        if (!summary?.modules?.distribution) return null;

        const labels = summary.modules.distribution.map(item => getModuleName(item.module));
        const data = summary.modules.distribution.map(item => item.count);
        const colors = ['#007bff', '#dc3545', '#ffc107', '#28a745', '#6f42c1', '#20c997'];

        return {
            barData: {
                labels,
                datasets: [{
                    label: 'Modül Kullanım Sayısı',
                    data,
                    backgroundColor: '#17a2b8',
                    borderColor: '#138496',
                    borderWidth: 1
                }]
            },
            pieData: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            }
        };
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, color: 'error.main' }}>
                <Typography variant="h6">
                    Hata: {error?.message || 'Veri yüklenirken bir hata oluştu'}
                </Typography>
            </Box>
        );
    }

    if (!summary) {
        return null;
    }

    const chartData = prepareChartData();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                📊 Sistem Paneli
            </Typography>

            <Grid container spacing={3}>
                {/* Proje İstatistikleri */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Proje İstatistikleri
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="Toplam Proje"
                                    secondary={summary.projects.total}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText 
                                    primary="Aktif Projeler"
                                    secondary={summary.projects.active}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText 
                                    primary="Tamamlanan Projeler"
                                    secondary={summary.projects.completed}
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* Modül İstatistikleri */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Modül İstatistikleri
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary="En Çok Kullanılan Modül"
                                    secondary={`${getModuleName(summary.modules.mostUsed.name)} (${summary.modules.mostUsed.count} projede)`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText 
                                    primary="Ortalama Modül/Proje"
                                    secondary={summary.modules.averagePerProject}
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                {/* Bar Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📊 Modül Kullanımı
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            {chartData && <Bar data={chartData.barData} options={barOptions} />}
                        </Box>
                    </Paper>
                </Grid>

                {/* Pie Chart */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            🥧 Modül Dağılımı
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            {chartData && <Pie data={chartData.pieData} options={chartOptions} />}
                        </Box>
                    </Paper>
                </Grid>

                {/* AI Yorumu */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" gutterBottom>
                            🧠 AI Yorumu
                        </Typography>
                        <Typography variant="body1">
                            {summary.modules.mostUsed.name === 'Yok' ? (
                                'Henüz yeterli veri bulunmamaktadır. Modül kullanımı arttıkça daha detaylı öneriler sunulacaktır.'
                            ) : (
                                <>
                                    En çok aktif edilen modül <strong>{getModuleName(summary.modules.mostUsed.name)}</strong> ({summary.modules.mostUsed.count} projede).
                                    Bu modül, benzer özellikteki yeni projelerde varsayılan olarak önerilebilir.
                                    {summary.modules.mostUsed.name === 'fire' && ' Özellikle büyük alanlı projelerde yangın sistemi kritik önem taşımaktadır.'}
                                    {summary.modules.mostUsed.name === 'energy' && ' Enerji verimliliği modern projelerde giderek daha fazla önem kazanmaktadır.'}
                                    {summary.modules.mostUsed.name === 'hvac' && ' İklimlendirme sistemleri kullanıcı konforu için temel gereksinimdir.'}
                                </>
                            )}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Modül Detayları */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <WhatshotIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Modül Dağılımı
                        </Typography>
                        <List>
                            {summary.modules.distribution.map(({ module, count, percentage }) => (
                                <ListItem key={module}>
                                    <ListItemIcon>
                                        {getModuleIcon(module)}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={getModuleName(module)}
                                        secondary={`${count} proje (${percentage}%)`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Bina Tipi Dağılımı */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Bina Tipi Dağılımı
                        </Typography>
                        <List>
                            {summary.buildingTypes.map(({ type, count, percentage }) => (
                                <ListItem key={type}>
                                    <ListItemText 
                                        primary={type}
                                        secondary={`${count} proje (${percentage}%)`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 