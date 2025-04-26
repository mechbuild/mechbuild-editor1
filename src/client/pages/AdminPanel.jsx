import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AdminPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/admin/projects", {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Projeler getirilemedi');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Projeleri getirme hatası:', error);
      toast.error('Projeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetModules = async (id) => {
    try {
      const response = await fetch(`/api/admin/project/${id}/reset-modules`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Modüller sıfırlanamadı');
      }

      toast.success('Modüller başarıyla sıfırlandı');
      fetchProjects();
    } catch (error) {
      console.error('Modül sıfırlama hatası:', error);
      toast.error('Modüller sıfırlanırken bir hata oluştu');
    }
  };

  const clearLogs = async (id) => {
    try {
      const response = await fetch(`/api/admin/project/${id}/clear-logs`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Loglar temizlenemedi');
      }

      toast.success('Loglar başarıyla temizlendi');
      fetchProjects();
    } catch (error) {
      console.error('Log temizleme hatası:', error);
      toast.error('Loglar temizlenirken bir hata oluştu');
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm("Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      try {
        const response = await fetch(`/api/admin/project/${id}`, {
          method: "DELETE",
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Proje silinemedi');
        }

        toast.success('Proje başarıyla silindi');
        fetchProjects();
      } catch (error) {
        console.error('Proje silme hatası:', error);
        toast.error('Proje silinirken bir hata oluştu');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🛠️ Admin Panel – Proje Yönetimi</h2>
      {projects.length === 0 ? (
        <p>Henüz proje bulunmuyor.</p>
      ) : (
        projects.map((p) => (
          <div 
            key={p._id} 
            style={{ 
              marginBottom: "1rem", 
              padding: "1rem", 
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9"
            }}
          >
            <p><strong>{p.name}</strong> – {p.location}</p>
            <p>Durum: {p.status}</p>
            <p>Aktif Modüller: {p.activeModules?.length || 0}</p>
            <p>Log Sayısı: {p.logs?.length || 0}</p>
            <div style={{ marginTop: "1rem" }}>
              <button 
                onClick={() => resetModules(p._id)}
                style={{
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Modülleri Sıfırla
              </button>
              <button 
                onClick={() => clearLogs(p._id)}
                style={{
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Logları Temizle
              </button>
              <button 
                onClick={() => deleteProject(p._id)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminPanel; 