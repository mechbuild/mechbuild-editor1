import express from 'express';
const router = express.Router();

let projectList = []; // Geçici bellekte saklıyoruz (ileride MongoDB'ye bağlanacağız)

router.post('/', (req, res) => {
  const { name, location, startDate, status } = req.body;

  if (!name || !location || !startDate || !status) {
    return res.status(400).json({ error: 'Tüm alanlar gereklidir.' });
  }

  const newProject = {
    id: projectList.length + 1,
    name,
    location,
    startDate,
    status
  };

  projectList.push(newProject);
  res.status(201).json({ message: 'Proje eklendi', project: newProject });
});

router.get('/', (req, res) => {
  res.json(projectList);
});

export default router; 