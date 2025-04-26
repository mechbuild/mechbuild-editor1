import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Tooltip } from '@mui/material';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import ErrorService from '../services/errorService';

// Türkiye GeoJSON haritası
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/turkey/turkey-provinces.json";

const MapDashboard = () => {
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedProvince, setSelectedProvince] = useState(null);

    useEffect(() => {
        loadLocationData();
    }, []);

    const loadLocationData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/dashboard/by-location', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Lokasyon verisi alınamadı');
            }

            const data = await response.json();
            if (data.success) {
                setSummary(data.summary);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            const processedError = await ErrorService.handleApiError(err, 'MapDashboard');
            setError(processedError);
        } finally {
            setLoading(false);
        }
    };

    const getColor = (province) => {
        const count = summary[province] || 0;
        if (count > 10) return "#dc3545";
        if (count > 5) return "#ffc107";
        if (count > 0) return "#28a745";
        return "#e9ecef";
    };

    const getAIComment = (province) => {
        const lowercaseProvince = province.toLowerCase();
        const projectCount = summary[province] || 0;

        // Bölgesel öneriler
        if (lowercaseProvince.includes('istanbul') || lowercaseProvince.includes('izmir') || lowercaseProvince.includes('bursa')) {
            return {
                risk: 'Deprem Riski',
                suggestion: 'Deprem yönetmeliğine uygun tasarım ve güçlendirme önerilir. Sismik izolatör sistemleri değerlendirilmeli.',
                priority: 'Yüksek'
            };
        }

        if (lowercaseProvince.includes('erzurum') || lowercaseProvince.includes('kars') || lowercaseProvince.includes('ağrı')) {
            return {
                risk: 'Soğuk İklim',
                suggestion: 'Yüksek ısı yalıtımı ve çift cidarlı cephe sistemleri önerilir. Kar yükü hesapları kritik.',
                priority: 'Yüksek'
            };
        }

        if (lowercaseProvince.includes('antalya') || lowercaseProvince.includes('muğla') || lowercaseProvince.includes('mersin')) {
            return {
                risk: 'Sıcak İklim',
                suggestion: 'Güneş kontrol camları ve gölgelendirme sistemleri önerilir. Nem kontrolü önemli.',
                priority: 'Orta'
            };
        }

        // Genel öneri
        return {
            risk: 'Standart Gereklilikler',
            suggestion: 'Bölgesel iklim ve zemin koşullarına göre standart mühendislik kriterleri uygulanmalı.',
            priority: 'Normal'
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
                    Hata: {error?.message || 'Harita verileri yüklenirken bir hata oluştu'}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                🗺️ Lokasyon Bazlı Proje Haritası
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '600px', position: 'relative' }}>
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 4000,
                                center: [35, 39]
                            }}
                        >
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const province = geo.properties.name;
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={getColor(province)}
                                                onClick={() => setSelectedProvince(province)}
                                                style={{
                                                    default: {
                                                        outline: "none",
                                                        stroke: "#FFF",
                                                        strokeWidth: 0.5
                                                    },
                                                    hover: {
                                                        fill: "#17a2b8",
                                                        outline: "none",
                                                        cursor: "pointer"
                                                    },
                                                    pressed: {
                                                        fill: "#17a2b8",
                                                        outline: "none"
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ComposableMap>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    {selectedProvince ? (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedProvince}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                Toplam Proje: <strong>{summary[selectedProvince] || 0}</strong>
                            </Typography>
                            
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    🧠 AI Analizi
                                </Typography>
                                {(() => {
                                    const analysis = getAIComment(selectedProvince);
                                    return (
                                        <>
                                            <Typography variant="subtitle1" color="error" gutterBottom>
                                                {analysis.risk}
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {analysis.suggestion}
                                            </Typography>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Öncelik: {analysis.priority}
                                            </Typography>
                                        </>
                                    );
                                })()}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                                Detaylı bilgi için haritadan bir il seçin
                            </Typography>
                        </Paper>
                    )}

                    <Paper sx={{ p: 3, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            📊 Renk Skalası
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#dc3545' }} />
                                <Typography>10+ Proje</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#ffc107' }} />
                                <Typography>6-10 Proje</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#28a745' }} />
                                <Typography>1-5 Proje</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 20, height: 20, bgcolor: '#e9ecef' }} />
                                <Typography>Proje Yok</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MapDashboard; 