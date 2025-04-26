import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const ProjectLogs = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error('Logları getirme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [id]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h3>🕓 AI Sistem Logları</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {logs
          .slice()
          .reverse()
          .map((log, idx) => (
            <li 
              key={idx} 
              style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <strong>[{log.type}]</strong> – {new Date(log.date).toLocaleString()}  
              <br />
              {log.message}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ProjectLogs; 