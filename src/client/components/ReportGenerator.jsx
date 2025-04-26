import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Grid,
    TextField,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Card,
    CardContent,
    Stack,
    Divider,
    Chip,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    Download,
    Refresh,
    Settings,
    Preview,
    PictureAsPdf,
    Description,
    BarChart,
    Functions,
    Style,
    TableChart,
    FormatColorFill,
    DataObject
} from '@mui/icons-material';

const ReportGenerator = ({ operationId, analysis }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportTitle, setReportTitle] = useState('Excel Analiz Raporu');
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeFormulas, setIncludeFormulas] = useState(true);
    const [includeStyles, setIncludeStyles] = useState(true);
    const [includeDetails, setIncludeDetails] = useState(true);
    const [includeRecommendations, setIncludeRecommendations] = useState(true);
    const [reportFormat, setReportFormat] = useState('pdf');
    const [activeTab, setActiveTab] = useState(0);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/export-analysis/${operationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: reportTitle,
                    includeCharts,
                    includeFormulas,
                    includeStyles,
                    includeDetails,
                    includeRecommendations,
                    format: reportFormat
                })
            });

            if (!response.ok) {
                throw new Error('Rapor oluşturma başarısız oldu');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportTitle}.${reportFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Rapor Oluştur</Typography>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Rapor Ayarları">
                        <IconButton>
                            <Settings />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Raporu Yenile">
                        <IconButton onClick={handleGenerateReport} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab icon={<Description />} label="Genel" />
                <Tab icon={<Preview />} label="Önizleme" />
                <Tab icon={<Settings />} label="Ayarlar" />
            </Tabs>

            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Rapor Başlığı"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            InputProps={{
                                startAdornment: <Description sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Rapor Formatı</InputLabel>
                            <Select
                                value={reportFormat}
                                label="Rapor Formatı"
                                onChange={(e) => setReportFormat(e.target.value)}
                                startAdornment={<PictureAsPdf sx={{ mr: 1, color: 'action.active' }} />}
                            >
                                <MenuItem value="pdf">PDF</MenuItem>
                                <MenuItem value="html">HTML</MenuItem>
                                <MenuItem value="excel">Excel</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Box>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Rapor Önizleme
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Description color="primary" />
                                    <Typography variant="body1">{reportTitle}</Typography>
                                </Box>
                                <Divider />
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2">İçerik</Typography>
                                            <Chip
                                                icon={<TableChart />}
                                                label={`${analysis.totalSheets} Sayfa`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<DataObject />}
                                                label={`${analysis.totalCells.toLocaleString()} Hücre`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<Functions />}
                                                label={`${analysis.totalFormulas.toLocaleString()} Formül`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2">Eklenecek Bölümler</Typography>
                                            {includeCharts && (
                                                <Chip
                                                    icon={<BarChart />}
                                                    label="Grafikler ve Pivot Tablolar"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                            {includeFormulas && (
                                                <Chip
                                                    icon={<Functions />}
                                                    label="Formül Analizi"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                            {includeStyles && (
                                                <Chip
                                                    icon={<Style />}
                                                    label="Stil Analizi"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {activeTab === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Rapor İçeriği
                        </Typography>
                        <Stack spacing={2}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeCharts}
                                        onChange={(e) => setIncludeCharts(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BarChart />
                                        <Typography>Grafikler ve Pivot Tablolar</Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeFormulas}
                                        onChange={(e) => setIncludeFormulas(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Functions />
                                        <Typography>Formül Analizi</Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeStyles}
                                        onChange={(e) => setIncludeStyles(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Style />
                                        <Typography>Stil Analizi</Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeDetails}
                                        onChange={(e) => setIncludeDetails(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FormatColorFill />
                                        <Typography>Detaylı Analiz</Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeRecommendations}
                                        onChange={(e) => setIncludeRecommendations(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Settings />
                                        <Typography>İyileştirme Önerileri</Typography>
                                    </Box>
                                }
                            />
                        </Stack>
                    </Grid>
                </Grid>
            )}

            {error && (
                <div className="error-message">
                    {error?.message || 'Rapor oluşturulurken bir hata oluştu'}
                </div>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <Download />}
                    onClick={handleGenerateReport}
                    disabled={loading}
                    size="large"
                >
                    {loading ? 'Rapor Oluşturuluyor...' : 'Raporu İndir'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ReportGenerator; 