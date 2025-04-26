import React, { useState } from 'react';
import { Box, Button, Select, MenuItem, TextField, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from '@mui/material';
import { Chat as ChatIcon, Code as CodeIcon } from '@mui/icons-material';

const AIConsole = ({ project }) => {
    const [mode, setMode] = useState('chat');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState([]);
    const [suggestions, setSuggestions] = useState([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = mode === 'chat' ? '/api/ai/chat' : '/api/ai/command';
            
            const response = await fetch(`http://localhost:3002${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    project,
                    [mode === 'chat' ? 'question' : 'command']: question
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setAnswer(data.message || data.answer);
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
                if (data.activateModules || data.deactivateModules) {
                    const activeModules = [
                        ...(data.activateModules || [])
                    ];
                    
                    setModules([
                        ...activeModules,
                        ...(data.deactivateModules || []).map(m => ({ name: m, deactivated: true }))
                    ]);

                    // Save module changes to the database
                    if (project._id && (data.activateModules?.length > 0 || data.deactivateModules?.length > 0)) {
                        const moduleUpdateResponse = await fetch(`http://localhost:3002/api/projects/modules/${project._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ modules: activeModules })
                        });

                        const moduleData = await moduleUpdateResponse.json();
                        if (!moduleData.success) {
                            console.error('Module update error:', moduleData.error);
                        }
                    }
                }
            } else {
                setAnswer(data.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('AI Error:', error);
            setAnswer('İstek gönderilirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="chat">
                            <ChatIcon sx={{ mr: 1 }} /> Soru-Cevap Modu
                        </MenuItem>
                        <MenuItem value="command">
                            <CodeIcon sx={{ mr: 1 }} /> Komut Modu
                        </MenuItem>
                    </Select>
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={mode === 'chat' ? 'Sorunuzu yazın...' : 'Komutunuzu yazın...'}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : mode === 'chat' ? 'Cevap Al' : 'Komutu Uygula'}
                    </Button>
                </form>

                {answer && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="body1">{answer}</Typography>
                    </Box>
                )}

                {suggestions.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>Öneriler:</Typography>
                        <List>
                            {suggestions.map((suggestion, index) => (
                                <ListItem key={index} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                                    <ListItemText
                                        primary={suggestion.content}
                                        secondary={suggestion.details}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {modules.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#e9f7ef', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>Aktif/Pasif Modüller:</Typography>
                        <List>
                            {modules.map((module, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>{getModuleIcon(typeof module === 'string' ? module : module.name)}</ListItemIcon>
                                    <ListItemText
                                        primary={`${getModuleName(typeof module === 'string' ? module : module.name)} MODÜLÜ`}
                                        secondary={typeof module === 'object' && module.deactivated ? 'Devre Dışı' : 'Aktif'}
                                        sx={{
                                            color: typeof module === 'object' && module.deactivated ? 'error.main' : 'success.main'
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AIConsole; 