const express = require('express');
const router = express.Router();
const AIChatService = require('../services/aiChatService');
const verifyToken = require('../middleware/auth');

// AI Chat endpoint
router.post("/chat", async (req, res) => {
    try {
        const { project, question } = req.body;
        
        if (!project || !question) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proje bilgileri ve soru gereklidir' 
            });
        }

        // AI yanıtı oluştur
        const response = { success: true, answer: `AI yanıtı: ${question}` };
        res.json(response);
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'AI yanıtı oluşturulurken bir hata oluştu' 
        });
    }
});

// AI Command endpoint
router.post("/command", async (req, res) => {
    try {
        const { project, command } = req.body;
        
        if (!project || !command) {
            return res.status(400).json({ 
                success: false, 
                error: 'Proje bilgileri ve komut gereklidir' 
            });
        }

        // Komutu işle
        const response = { success: true, result: `Komut işlendi: ${command}` };
        res.json(response);
    } catch (error) {
        console.error('AI Command Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Komut işlenirken bir hata oluştu' 
        });
    }
});

// AI Process endpoint
router.post('/process', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'İşlenecek veri gereklidir'
            });
        }
        res.json({ 
            success: true, 
            message: 'AI processing completed',
            result: `İşlenen veri: ${data}` 
        });
    } catch (error) {
        console.error('AI Process Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'AI processing failed' 
        });
    }
});

module.exports = router; 