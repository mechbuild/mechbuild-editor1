import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PDFAnalysis from "../components/PDFAnalysis";

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
      <h2 className="text-2xl font-bold mb-4">{project.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Proje Detayları</h3>
          <p><strong>Lokasyon:</strong> {project.location}</p>
          <p><strong>Başlangıç Tarihi:</strong> {project.startDate}</p>
          <p><strong>Durum:</strong> {project.status}</p>
        </div>
        <div>
          <PDFAnalysis />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 