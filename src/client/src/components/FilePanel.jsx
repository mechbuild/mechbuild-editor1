import React, { useState, useEffect, useCallback } from 'react';
import { FiUpload, FiDownload, FiTrash2, FiFile, FiFileText, FiImage } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import ErrorService from '../services/errorService';
import ThemeService from '../services/themeService';
import { useNotification } from '../contexts/NotificationContext';

const FilePanel = ({ projectId }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/files/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Dosyalar yüklenirken bir hata oluştu');
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(ErrorService.getErrorMessage(err));
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FiImage />;
    if (['pdf', 'doc', 'docx'].includes(ext)) return <FiFileText />;
    return <FiFile />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload({ target: { files: [files[0]] } });
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan büyük olamaz');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Desteklenmeyen dosya formatı');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          await loadFiles();
          setSuccess('Dosya başarıyla yüklendi');
          setUploadProgress(0);
        } else {
          throw new Error('Dosya yüklenirken bir hata oluştu');
        }
      };

      xhr.onerror = () => {
        throw new Error('Dosya yüklenirken bir hata oluştu');
      };

      xhr.open('POST', `http://localhost:3002/api/files/${projectId}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(ErrorService.getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/files/${projectId}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Dosya silinirken bir hata oluştu');
      }

      await loadFiles();
      showNotification(t('filePanel.deleted'), 'success');
    } catch (err) {
      setError(ErrorService.getErrorMessage(err));
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/files/${projectId}/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Dosya indirilirken bir hata oluştu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = files.find(f => f._id === fileId).name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification(t('filePanel.downloaded'), 'success');
    } catch (err) {
      setError(ErrorService.getErrorMessage(err));
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('filePanel.title')}
        </Typography>
        <List>
          {files.map((file) => (
            <ListItem
              key={file._id}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="download"
                    onClick={() => handleDownload(file._id)}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(file._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={`${t('filePanel.size')}: ${formatFileSize(file.size)}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default FilePanel; 