import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, Description } from '@mui/icons-material';
import ProgressIndicator from './ProgressIndicator';

const FileUploader = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [operationId, setOperationId] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;

            const file = acceptedFiles[0];
            setUploading(true);
            setError(null);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/process-excel', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Dosya yükleme başarısız oldu');
                }

                const data = await response.json();
                setOperationId(data.operationId);
                setAnalysis(data.analysis);
                onUploadComplete(data.operationId, data.analysis);
            } catch (err) {
                setError(err.message);
            } finally {
                setUploading(false);
            }
        }
    });

    return (
        <Box>
            <Paper
                {...getRootProps()}
                elevation={isDragActive ? 3 : 1}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive
                        ? 'Dosyayı buraya bırakın'
                        : 'Excel dosyasını sürükleyip bırakın'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    veya dosyayı seçmek için tıklayın
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Sadece .xlsx uzantılı dosyalar kabul edilir
                </Typography>
            </Paper>

            {uploading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Dosya yükleniyor ve analiz ediliyor...
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error?.message || 'Dosya yükleme sırasında bir hata oluştu'}
                </Alert>
            )}

            {operationId && (
                <Box sx={{ mt: 3 }}>
                    <ProgressIndicator operationId={operationId} />
                </Box>
            )}
        </Box>
    );
};

export default FileUploader; 