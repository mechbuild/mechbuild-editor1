import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ErrorService from '../../services/errorService';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    startDate: "",
    status: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(ErrorService.getErrorMessage('API', 'LOAD_FAILED'));
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Load Projects');
      setError(processedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleAddProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newProject)
      });

      if (!response.ok) {
        throw new Error(ErrorService.getErrorMessage('API', 'SAVE_FAILED'));
      }

      const data = await response.json();
      setProjects([...projects, data.project]);
      setNewProject({ name: "", location: "", startDate: "", status: "" });
      setFormVisible(false);
      setSuccess(true);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Add Project');
      setError(processedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/export/projects');
      if (!response.ok) {
        throw new Error(ErrorService.getErrorMessage('API', 'EXPORT_FAILED'));
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projeler.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(true);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Export Projects');
      setError(processedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}

      {success && (
        <div className="success-message">
          İşlem başarıyla tamamlandı!
        </div>
      )}

      <h2>Projeler</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={cell}>Proje Adı</th>
            <th style={cell}>Lokasyon</th>
            <th style={cell}>Başlangıç Tarihi</th>
            <th style={cell}>Durum</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td style={cell}>
                <Link to={`/projects/${project.id}`} style={{ color: "#007bff", textDecoration: "underline" }}>
                  {project.name}
                </Link>
              </td>
              <td style={cell}>{project.location}</td>
              <td style={cell}>{project.startDate}</td>
              <td style={cell}>{project.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button 
          style={button} 
          onClick={() => setFormVisible(true)}
          disabled={isLoading}
        >
          Yeni Proje Ekle
        </button>
        <button 
          style={button} 
          onClick={handleExportToExcel}
          disabled={isLoading}
        >
          Excel'e Aktar
        </button>
      </div>

      {formVisible && (
        <div style={{ marginTop: "2rem" }}>
          <input 
            type="text" 
            name="name" 
            placeholder="Proje Adı" 
            value={newProject.name} 
            onChange={handleChange} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            name="location" 
            placeholder="Lokasyon" 
            value={newProject.location} 
            onChange={handleChange} 
            style={inputStyle} 
          />
          <input 
            type="date" 
            name="startDate" 
            value={newProject.startDate} 
            onChange={handleChange} 
            style={inputStyle} 
          />
          <input 
            type="text" 
            name="status" 
            placeholder="Durum" 
            value={newProject.status} 
            onChange={handleChange} 
            style={inputStyle} 
          />
          <button 
            style={button} 
            onClick={handleAddProject}
            disabled={isLoading}
          >
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
};

const cell = {
  border: "1px solid #ccc",
  padding: "0.75rem",
  textAlign: "left"
};

const button = {
  padding: "0.5rem 1.5rem",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  opacity: 1
};

const inputStyle = {
  margin: "0.5rem",
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: "4px"
};

export default Projects;