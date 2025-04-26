const Projects = () => {
    const handleExcelExport = () => {
      window.open("http://localhost:3001/api/export/projects", "_blank");
    };

    const handleAddProject = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newProject)
        });

        const data = await response.json();
        if (response.ok) {
          setProjects([...projects, data.project]);
          setNewProject({ name: "", location: "", startDate: "", status: "" });
          setFormVisible(false);
        } else {
          alert(data.error || "Bir hata oluştu");
        }
      } catch (error) {
        alert("Sunucu bağlantı hatası");
      }
    };

    return (
      <div style={{ padding: '2rem' }}>
        <h2>Projeler</h2>
        <p>Burada projelerin listesi yer alacak.</p>
        <button style={button} onClick={handleExcelExport}>Excel'e Aktar</button>
      </div>
    );
  };
  
  export default Projects;
  