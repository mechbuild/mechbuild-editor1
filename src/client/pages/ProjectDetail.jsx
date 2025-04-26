import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/api/projects`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p) => p.id === parseInt(id));
        setProject(found);
      });
  }, [id]);

  if (!project) {
    return <div style={{ padding: "2rem" }}>Proje bulunamadı...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{project.name}</h2>
      <p><strong>Lokasyon:</strong> {project.location}</p>
      <p><strong>Başlangıç Tarihi:</strong> {project.startDate}</p>
      <p><strong>Durum:</strong> {project.status}</p>
      <Link 
        to={`/project/${project._id}/logs`} 
        style={{ 
          marginTop: "0.5rem", 
          display: "block",
          padding: "0.5rem 1rem",
          backgroundColor: "#f0f0f0",
          borderRadius: "4px",
          textDecoration: "none",
          color: "#333"
        }}
      >
        📘 Logları Gör
      </Link>
    </div>
  );
};

export default ProjectDetail; 