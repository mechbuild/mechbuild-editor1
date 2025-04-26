import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Chip,
    LinearProgress,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
    Alert
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    Stop,
    Delete,
    PriorityHigh,
    LowPriority,
    Schedule,
    CheckCircle,
    Error,
    Warning,
    Info,
    Add,
    Remove
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const BatchProcessor = () => {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [priorityDialog, setPriorityDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: true
    });

    function handleDrop(acceptedFiles) {
        const newFiles = acceptedFiles.map(file => ({
            id: Date.now() + Math.random(),
            file,
            status: 'pending',
            priority: 'normal',
            progress: 0,
            error: null,
            addedAt: new Date()
        }));

        setQueue(prev => [...prev, ...newFiles]);
    }

    const handlePriorityChange = (fileId, priority) => {
        setQueue(prev => prev.map(file => 
            file.id === fileId ? { ...file, priority } : file
        ));
    };

    const handleRemoveFile = (fileId) => {
        setQueue(prev => prev.filter(file => file.id !== fileId));
    };

    const handleStartProcessing = async () => {
        if (queue.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Öncelik sırasına göre sırala
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            const sortedQueue = [...queue].sort((a, b) => 
                priorityOrder[a.priority] - priorityOrder[b.priority]
            );

            for (const file of sortedQueue) {
                if (file.status === 'pending') {
                    setCurrentFile(file);
                    await processFile(file);
                }
            }
        } catch (error) {
            setError('Toplu işlem sırasında bir hata oluştu');
            console.error('Batch processing error:', error);
        } finally {
            setIsProcessing(false);
            setCurrentFile(null);
        }
    };

    const processFile = async (file) => {
        try {
            // Dosya durumunu güncelle
            setQueue(prev => prev.map(f => 
                f.id === file.id ? { ...f, status: 'processing' } : f
            ));

            // İşlem simülasyonu
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                setQueue(prev => prev.map(f => 
                    f.id === file.id ? { ...f, progress: i } : f
                ));
            }

            // Başarılı durumu güncelle
            setQueue(prev => prev.map(f => 
                f.id === file.id ? { ...f, status: 'completed' } : f
            ));
        } catch (error) {
            // Hata durumunu güncelle
            setQueue(prev => prev.map(f => 
                f.id === file.id ? { ...f, status: 'failed', error: error.message } : f
            ));
            throw error;
        }
    };

    const handleStopProcessing = () => {
        setIsProcessing(false);
        setCurrentFile(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle color="success" />;
            case 'failed':
                return <Error color="error" />;
            case 'processing':
                return <Info color="info" />;
            default:
                return <Warning color="warning" />;
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high':
                return <PriorityHigh color="error" />;
            case 'low':
                return <LowPriority color="action" />;
            default:
                return <Schedule color="primary" />;
        }
    };

    return (
        <Box>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Toplu Dosya İşleme
                    </Typography>

                    {/* Hata gösterimi */}
                    {error && (
                        <div className="error-message">
                            {error?.message || 'Toplu işlem sırasında bir hata oluştu'}
                        </div>
                    )}

                    {/* Dosya yükleme alanı */}
                    <Box
                        {...getRootProps()}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragActive ? 'primary.main' : 'grey.300',
                            borderRadius: 1,
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            mb: 3
                        }}
                    >
                        <input {...getInputProps()} />
                        <Typography>
                            {isDragActive
                                ? 'Dosyaları buraya bırakın'
                                : 'Dosyaları sürükleyip bırakın veya seçmek için tıklayın'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Excel dosyaları (.xlsx, .xls)
                        </Typography>
                    </Box>

                    {/* Kontrol butonları */}
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isProcessing ? <Pause /> : <PlayArrow />}
                            onClick={isProcessing ? handleStopProcessing : handleStartProcessing}
                            disabled={queue.length === 0}
                        >
                            {isProcessing ? 'Durdur' : 'İşlemi Başlat'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => setQueue([])}
                            disabled={queue.length === 0 || isProcessing}
                        >
                            Kuyruğu Temizle
                        </Button>
                    </Stack>

                    {/* İşlem kuyruğu */}
                    <List>
                        {queue.map((file) => (
                            <ListItem
                                key={file.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1
                                }}
                            >
                                <ListItemIcon>
                                    {getStatusIcon(file.status)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={file.file.name}
                                    secondary={
                                        <Box>
                                            <Typography variant="body2">
                                                Durum: {file.status}
                                            </Typography>
                                            {file.status === 'processing' && (
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={file.progress}
                                                    sx={{ mt: 1 }}
                                                />
                                            )}
                                            {file.error && (
                                                <Typography
                                                    variant="body2"
                                                    color="error"
                                                    sx={{ mt: 1 }}
                                                >
                                                    Hata: {file.error}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title="Öncelik Değiştir">
                                            <IconButton
                                                onClick={() => {
                                                    setSelectedFile(file);
                                                    setPriorityDialog(true);
                                                }}
                                                disabled={isProcessing}
                                            >
                                                {getPriorityIcon(file.priority)}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Kaldır">
                                            <IconButton
                                                onClick={() => handleRemoveFile(file.id)}
                                                disabled={isProcessing}
                                            >
                                                <Remove />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Öncelik değiştirme dialogu */}
            <Dialog
                open={priorityDialog}
                onClose={() => setPriorityDialog(false)}
            >
                <DialogTitle>Öncelik Değiştir</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="Öncelik"
                        value={selectedFile?.priority || 'normal'}
                        onChange={(e) => {
                            handlePriorityChange(selectedFile.id, e.target.value);
                            setPriorityDialog(false);
                        }}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="high">Yüksek</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="low">Düşük</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPriorityDialog(false)}>İptal</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BatchProcessor; 