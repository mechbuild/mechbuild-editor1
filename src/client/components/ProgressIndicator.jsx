import React, { useState, useEffect } from 'react';
import { 
    Box, 
    LinearProgress, 
    Typography, 
    Paper, 
    IconButton, 
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Grid,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stack,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    Alert,
    Button,
    ToggleButton,
    ToggleButtonGroup,
    FormControlLabel,
    Switch,
    Collapse
} from '@mui/material';
import { 
    CheckCircle, 
    Error, 
    Cancel,
    ExpandMore,
    ExpandLess,
    TableChart,
    Functions,
    BarChart,
    TableRows,
    Style,
    FormatColorFill,
    DataObject,
    PictureAsPdf,
    PieChart,
    ShowChart,
    FilterList,
    Sort,
    Assessment,
    Speed,
    Memory,
    Timeline,
    Warning,
    Info,
    Download,
    ViewModule,
    ViewList,
    ViewComfy,
    Settings
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import axios from 'axios';

// Chart.js kayıtları
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement
);

const ProgressIndicator = ({ operationId, onComplete, onError, onCancel }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('pending');
    const [message, setMessage] = useState('İşlem başlatılıyor...');
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterType, setFilterType] = useState('all');
    const [isExporting, setIsExporting] = useState(false);
    const [viewMode, setViewMode] = useState('detailed');
    const [showMetrics, setShowMetrics] = useState(true);
    const [showCharts, setShowCharts] = useState(true);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [showDetails, setShowDetails] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const checkProgress = async () => {
            try {
                const response = await axios.get(`/api/operation/${operationId}`);
                const { progress, status, message, analysis } = response.data;

                setProgress(progress);
                setStatus(status);
                setMessage(message);
                if (analysis) {
                    setAnalysis(analysis);
                }

                if (status === 'completed' || status === 'failed' || status === 'cancelled') {
                    clearInterval(interval);
                }
            } catch (err) {
                setError('İşlem durumu alınamadı');
                clearInterval(interval);
            }
        };

        const interval = setInterval(checkProgress, 1000);
        return () => clearInterval(interval);
    }, [operationId]);

    const handleCancel = async () => {
        try {
            await axios.post(`/api/operation/${operationId}/cancel`);
            setStatus('cancelled');
            onCancel?.();
        } catch (err) {
            setError('İşlem iptal edilemedi');
        }
    };

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);
            const response = await fetch(`/api/export-analysis/${operationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('PDF dışa aktarma başarısız oldu');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `excel-analysis-${operationId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF dışa aktarma hatası:', error);
            setError('PDF dışa aktarma sırasında bir hata oluştu');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'completed':
                return <CheckCircle color="success" />;
            case 'failed':
                return <Error color="error" />;
            case 'cancelled':
                return <Cancel color="warning" />;
            case 'pending':
                return <Info color="primary" />;
            default:
                return <Info color="primary" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'failed':
                return 'error';
            case 'cancelled':
                return 'warning';
            case 'pending':
                return 'info';
            default:
                return 'primary';
        }
    };

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const renderVisualization = (analysis) => {
        const sheetData = analysis.sheets.map(sheet => ({
            name: sheet.name,
            cells: sheet.cells.withData,
            formulas: sheet.cells.withFormulas,
            styles: sheet.cells.withStyles
        }));

        const chartData = {
            labels: sheetData.map(sheet => sheet.name),
            datasets: [
                {
                    label: 'Dolu Hücreler',
                    data: sheetData.map(sheet => sheet.cells),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Formüller',
                    data: sheetData.map(sheet => sheet.formulas),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Stiller',
                    data: sheetData.map(sheet => sheet.styles),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        };

        const complexityData = {
            labels: ['Sayfa Sayısı', 'Hücre Sayısı', 'Formül Sayısı', 'Grafik/Pivot'],
            datasets: [{
                data: [
                    analysis.totalSheets * 5,
                    Math.log10(analysis.totalCells) * 10,
                    analysis.totalFormulas * 2,
                    (analysis.totalCharts + analysis.totalPivotTables) * 3
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        };

        const [activeTab, setActiveTab] = useState(0);

        return (
            <Box sx={{ mt: 2 }}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Veri Görselleştirme
                    </Typography>
                    
                    <Tabs 
                        value={activeTab} 
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{ mb: 2 }}
                    >
                        <Tab icon={<BarChart />} label="Sayfa Analizi" />
                        <Tab icon={<PieChart />} label="Karmaşıklık" />
                        <Tab icon={<ShowChart />} label="Trend" />
                    </Tabs>

                    {activeTab === 0 && (
                        <Box sx={{ height: 400 }}>
                            <Bar 
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }}
                            />
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ height: 400 }}>
                            <Pie 
                                data={complexityData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                            />
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box sx={{ height: 400 }}>
                            <Line 
                                data={{
                                    labels: sheetData.map(sheet => sheet.name),
                                    datasets: [{
                                        label: 'Hücre Yoğunluğu',
                                        data: sheetData.map(sheet => 
                                            (sheet.cells / (sheetData[0].cells || 1)) * 100
                                        ),
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        tension: 0.1
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Yoğunluk (%)'
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    };

    const filterAndSortSheets = (sheets) => {
        return sheets
            .filter(sheet => {
                const matchesText = sheet.name.toLowerCase().includes(filterText.toLowerCase());
                const matchesType = filterType === 'all' || 
                    (filterType === 'withFormulas' && sheet.cells.withFormulas > 0) ||
                    (filterType === 'withCharts' && sheet.charts.length > 0) ||
                    (filterType === 'withPivot' && sheet.pivotTables.length > 0);
                return matchesText && matchesType;
            })
            .sort((a, b) => {
                const order = sortOrder === 'asc' ? 1 : -1;
                switch (sortBy) {
                    case 'name':
                        return order * a.name.localeCompare(b.name);
                    case 'cells':
                        return order * (a.cells.withData - b.cells.withData);
                    case 'formulas':
                        return order * (a.cells.withFormulas - b.cells.withFormulas);
                    case 'charts':
                        return order * (a.charts.length - b.charts.length);
                    default:
                        return 0;
                }
            });
    };

    const renderFilters = () => (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                    size="small"
                    placeholder="Sayfa Ara..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    InputProps={{
                        startAdornment: <FilterList sx={{ mr: 1, color: 'action.active' }} />
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Filtrele</InputLabel>
                    <Select
                        value={filterType}
                        label="Filtrele"
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="all">Tümü</MenuItem>
                        <MenuItem value="withFormulas">Formül İçerenler</MenuItem>
                        <MenuItem value="withCharts">Grafik İçerenler</MenuItem>
                        <MenuItem value="withPivot">Pivot Tablo İçerenler</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sırala</InputLabel>
                    <Select
                        value={sortBy}
                        label="Sırala"
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <MenuItem value="name">İsim</MenuItem>
                        <MenuItem value="cells">Hücre Sayısı</MenuItem>
                        <MenuItem value="formulas">Formül Sayısı</MenuItem>
                        <MenuItem value="charts">Grafik Sayısı</MenuItem>
                    </Select>
                </FormControl>
                <IconButton 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    color={sortOrder === 'asc' ? 'primary' : 'default'}
                >
                    <Sort />
                </IconButton>
            </Stack>
        </Paper>
    );

    const renderPerformanceMetrics = (analysis) => {
        const metrics = [
            {
                title: 'Hücre Yoğunluğu',
                value: Math.round((analysis.totalCells / (analysis.totalSheets * 1000000)) * 100),
                icon: <DataObject />,
                description: 'Sayfa başına düşen hücre yoğunluğu'
            },
            {
                title: 'Formül Karmaşıklığı',
                value: Math.round((analysis.totalFormulas / analysis.totalCells) * 100),
                icon: <Functions />,
                description: 'Formül içeren hücre oranı'
            },
            {
                title: 'Stil Çeşitliliği',
                value: Math.round((analysis.styles.size / 100) * 100),
                icon: <FormatColorFill />,
                description: 'Benzersiz stil sayısı'
            },
            {
                title: 'Grafik/Pivot Oranı',
                value: Math.round(((analysis.totalCharts + analysis.totalPivotTables) / analysis.totalSheets) * 100),
                icon: <BarChart />,
                description: 'Sayfa başına düşen grafik ve pivot tablo sayısı'
            }
        ];

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Performans Metrikleri
                    </Typography>
                    <Grid container spacing={2}>
                        {metrics.map((metric, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        {metric.icon}
                                        <Typography variant="subtitle1">{metric.title}</Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={metric.value}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            mb: 1,
                                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: metric.value > 70 ? 'error.main' :
                                                              metric.value > 40 ? 'warning.main' : 'success.main'
                                            }
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {metric.description}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 1 }}>
                                        {metric.value}%
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderPerformanceAnalysis = (analysis) => {
        const performanceData = {
            labels: analysis.sheets.map(sheet => sheet.name),
            datasets: [
                {
                    label: 'Hücre Yoğunluğu',
                    data: analysis.sheets.map(sheet => 
                        Math.round((sheet.cells.total / (sheet.rowCount * sheet.columnCount)) * 100)
                    ),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    yAxisID: 'y'
                },
                {
                    label: 'Formül Oranı',
                    data: analysis.sheets.map(sheet => 
                        Math.round((sheet.cells.withFormulas / sheet.cells.total) * 100)
                    ),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    yAxisID: 'y1'
                }
            ]
        };

        const styleData = {
            labels: ['Dolu Hücreler', 'Formül İçeren', 'Stil İçeren', 'Boş Hücreler'],
            datasets: [{
                data: [
                    analysis.totalCells - analysis.sheets.reduce((sum, sheet) => sum + sheet.cells.empty, 0),
                    analysis.totalFormulas,
                    analysis.sheets.reduce((sum, sheet) => sum + sheet.cells.withStyles, 0),
                    analysis.sheets.reduce((sum, sheet) => sum + sheet.cells.empty, 0)
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(201, 203, 207, 0.6)'
                ]
            }]
        };

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Detaylı Performans Analizi
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 300 }}>
                                <Line
                                    data={performanceData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        interaction: {
                                            mode: 'index',
                                            intersect: false
                                        },
                                        scales: {
                                            y: {
                                                type: 'linear',
                                                display: true,
                                                position: 'left',
                                                title: {
                                                    display: true,
                                                    text: 'Hücre Yoğunluğu (%)'
                                                }
                                            },
                                            y1: {
                                                type: 'linear',
                                                display: true,
                                                position: 'right',
                                                title: {
                                                    display: true,
                                                    text: 'Formül Oranı (%)'
                                                },
                                                grid: {
                                                    drawOnChartArea: false
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 300 }}>
                                <Pie
                                    data={styleData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right'
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const renderRecommendations = (analysis) => {
        const recommendations = [];

        // Hücre yoğunluğu kontrolü
        if (analysis.totalCells > 1000000) {
            recommendations.push({
                severity: 'warning',
                message: 'Çok fazla hücre içeriyor. Veri modelleme veya veritabanı kullanımı düşünülebilir.',
                icon: <DataObject />
            });
        }

        // Formül karmaşıklığı kontrolü
        if (analysis.totalFormulas > 1000) {
            recommendations.push({
                severity: 'warning',
                message: 'Formül sayısı yüksek. Makro veya VBA kullanımı düşünülebilir.',
                icon: <Functions />
            });
        }

        // Grafik ve pivot tablo kontrolü
        if (analysis.totalCharts + analysis.totalPivotTables > 20) {
            recommendations.push({
                severity: 'info',
                message: 'Çok fazla grafik ve pivot tablo var. Dashboard ayrı bir dosyada tutulabilir.',
                icon: <BarChart />
            });
        }

        // Stil çeşitliliği kontrolü
        if (analysis.styles.size > 100) {
            recommendations.push({
                severity: 'info',
                message: 'Stil çeşitliliği fazla. Stil şablonları kullanılabilir.',
                icon: <FormatColorFill />
            });
        }

        // Performans önerileri
        if (analysis.complexityScore > 75) {
            recommendations.push({
                severity: 'error',
                message: 'Dosya karmaşıklığı yüksek. Optimizasyon önerilir.',
                icon: <Speed />
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                severity: 'success',
                message: 'Dosya performansı iyi durumda. Herhangi bir optimizasyon önerisi bulunmuyor.',
                icon: <CheckCircle />
            });
        }

        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        İyileştirme Önerileri
                    </Typography>
                    <List>
                        {recommendations.map((rec, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    {rec.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Alert
                                            severity={rec.severity}
                                            sx={{ width: '100%' }}
                                        >
                                            {rec.message}
                                        </Alert>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>
        );
    };

    const renderExportButton = () => {
        if (status !== 'completed' || !analysis) return null;

        return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={isExporting ? <CircularProgress size={20} /> : <PictureAsPdf />}
                    onClick={handleExportPDF}
                    disabled={isExporting}
                >
                    {isExporting ? 'PDF Oluşturuluyor...' : 'PDF Olarak Dışa Aktar'}
                </Button>
            </Box>
        );
    };

    const handleViewModeChange = (event, newViewMode) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    const renderViewControls = () => {
        if (status !== 'completed' || !analysis) return null;

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={handleViewModeChange}
                            size="small"
                        >
                            <ToggleButton value="detailed">
                                <ViewModule />
                            </ToggleButton>
                            <ToggleButton value="compact">
                                <ViewList />
                            </ToggleButton>
                            <ToggleButton value="summary">
                                <ViewComfy />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Stack direction="row" spacing={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showMetrics}
                                        onChange={(e) => setShowMetrics(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Metrikler"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showCharts}
                                        onChange={(e) => setShowCharts(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Grafikler"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showRecommendations}
                                        onChange={(e) => setShowRecommendations(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Öneriler"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showDetails}
                                        onChange={(e) => setShowDetails(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Detaylar"
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    const renderAnalysisDetails = () => {
        if (!analysis) return null;

        return (
            <Box sx={{ mt: 3 }}>
                {renderExportButton()}
                {renderViewControls()}
                
                <Typography variant="h6" gutterBottom>
                    Excel Analiz Sonuçları
                </Typography>

                {/* Genel Bakış */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <TableChart color="primary" />
                                    <Typography variant="h6">Toplam Sayfa</Typography>
                                </Stack>
                                <Typography variant="h4">{analysis.totalSheets}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <DataObject color="primary" />
                                    <Typography variant="h6">Toplam Hücre</Typography>
                                </Stack>
                                <Typography variant="h4">{analysis.totalCells.toLocaleString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Functions color="primary" />
                                    <Typography variant="h6">Toplam Formül</Typography>
                                </Stack>
                                <Typography variant="h4">{analysis.totalFormulas.toLocaleString()}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <BarChart color="primary" />
                                    <Typography variant="h6">Grafik/Pivot</Typography>
                                </Stack>
                                <Typography variant="h4">
                                    {analysis.totalCharts + analysis.totalPivotTables}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Karmaşıklık Skoru */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Karmaşıklık Analizi
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={analysis.complexityScore}
                                size={80}
                                thickness={4}
                                sx={{
                                    color: analysis.complexityScore > 75 ? 'error.main' :
                                           analysis.complexityScore > 50 ? 'warning.main' : 'success.main'
                                }}
                            />
                            <Box>
                                <Typography variant="h4">
                                    {analysis.complexityScore}%
                                </Typography>
                                <Typography color="text.secondary">
                                    Dosya Karmaşıklık Skoru
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Performans Metrikleri */}
                <Collapse in={showMetrics}>
                    {renderPerformanceMetrics(analysis)}
                </Collapse>

                {/* Detaylı Performans Analizi */}
                <Collapse in={showCharts}>
                    {renderPerformanceAnalysis(analysis)}
                </Collapse>

                {/* Sayfa Detayları */}
                <Collapse in={showDetails}>
                    {analysis.sheets.map((sheet, index) => (
                        <Accordion key={index} sx={{ mb: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography variant="subtitle1">{sheet.name}</Typography>
                                    <Chip
                                        label={`${sheet.rowCount} x ${sheet.columnCount}`}
                                        size="small"
                                        color="info"
                                    />
                                    <Chip
                                        label={`${sheet.cells.withData.toLocaleString()} hücre`}
                                        size="small"
                                        color="primary"
                                    />
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Hücre Analizi
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <DataObject />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Toplam Hücre"
                                                    secondary={sheet.cells.total.toLocaleString()}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <Functions />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Formül İçeren Hücreler"
                                                    secondary={sheet.cells.withFormulas.toLocaleString()}
                                                />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <FormatColorFill />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Stil İçeren Hücreler"
                                                    secondary={sheet.cells.withStyles.toLocaleString()}
                                                />
                                            </ListItem>
                                        </List>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Özel Öğeler
                                        </Typography>
                                        <List dense>
                                            {sheet.charts.length > 0 && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <BarChart />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Grafikler"
                                                        secondary={sheet.charts.length}
                                                    />
                                                </ListItem>
                                            )}
                                            {sheet.pivotTables.length > 0 && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <TableChart />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Pivot Tablolar"
                                                        secondary={sheet.pivotTables.length}
                                                    />
                                                </ListItem>
                                            )}
                                            {sheet.conditionalFormats.length > 0 && (
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <FormatColorFill />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Koşullu Biçimlendirme"
                                                        secondary={sheet.conditionalFormats.length}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Collapse>

                {/* Görselleştirmeler */}
                <Collapse in={showCharts}>
                    <Card sx={{ mt: 3, mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Veri Görselleştirme
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <Bar
                                    data={{
                                        labels: analysis.sheets.map(sheet => sheet.name),
                                        datasets: [
                                            {
                                                label: 'Dolu Hücreler',
                                                data: analysis.sheets.map(sheet => sheet.cells.withData),
                                                backgroundColor: 'rgba(75, 192, 192, 0.6)'
                                            },
                                            {
                                                label: 'Formüller',
                                                data: analysis.sheets.map(sheet => sheet.cells.withFormulas),
                                                backgroundColor: 'rgba(153, 102, 255, 0.6)'
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top'
                                            }
                                        }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Collapse>

                {/* İyileştirme Önerileri */}
                <Collapse in={showRecommendations}>
                    {renderRecommendations(analysis)}
                </Collapse>
            </Box>
        );
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon()}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                        {message}
                    </Typography>
                </Box>
                <Chip
                    label={status.toUpperCase()}
                    color={getStatusColor()}
                    size="small"
                />
                {analysis && (
                    <Tooltip title={expanded ? "Detayları Gizle" : "Detayları Göster"}>
                        <IconButton onClick={handleExpandClick}>
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />

            {error && (
                <div className="error-message">
                    {error?.message || 'İşlem sırasında bir hata oluştu'}
                </div>
            )}

            <Collapse in={expanded}>
                {renderAnalysisDetails()}
            </Collapse>
        </Paper>
    );
};

export default ProgressIndicator; 