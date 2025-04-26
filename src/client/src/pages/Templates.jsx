import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorService from '../services/errorService';
import ValidationService from '../services/validationService';
import ThemeService from '../services/themeService';
import LoadingSpinner from '../components/LoadingSpinner';
import { SketchPicker } from 'react-color';

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    isPublic: false,
    styles: {
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#333333',
      secondaryColor: '#666666',
      accentColor: '#007bff',
      backgroundColor: '#ffffff',
      headerStyle: 'centered',
      pageSize: 'A4'
    },
    sections: [
      {
        name: 'header',
        title: 'Başlık',
        enabled: true,
        order: 1,
        customContent: { header: '', footer: '' }
      },
      {
        name: 'projectInfo',
        title: 'Proje Bilgileri',
        enabled: true,
        order: 2,
        customContent: { header: '', footer: '' }
      },
      {
        name: 'aiSuggestions',
        title: 'AI Önerileri',
        enabled: true,
        order: 3,
        customContent: { header: '', footer: '' }
      },
      {
        name: 'zoneSystems',
        title: 'Zon Sistemleri',
        enabled: true,
        order: 4,
        customContent: { header: '', footer: '' }
      }
    ]
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Şablonlar yüklenirken hata oluştu');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      ErrorService.showError(err.message, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/templates', {
        method: selectedTemplate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedTemplate || newTemplate)
      });

      if (!response.ok) {
        throw new Error('Şablon kaydedilirken hata oluştu');
      }

      await loadTemplates();
      setShowForm(false);
      setSelectedTemplate(null);
      setNewTemplate({
        name: '',
        description: '',
        isPublic: false,
        styles: { ...newTemplate.styles },
        sections: [...newTemplate.sections]
      });
      ErrorService.showSuccess('Şablon başarıyla kaydedildi', setSuccess);
    } catch (err) {
      ErrorService.showError(err.message, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Şablon silinirken hata oluştu');
      }

      await loadTemplates();
      ErrorService.showSuccess('Şablon başarıyla silindi', setSuccess);
    } catch (err) {
      ErrorService.showError(err.message, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (color) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        styles: {
          ...selectedTemplate.styles,
          [activeColor]: color.hex
        }
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        styles: {
          ...newTemplate.styles,
          [activeColor]: color.hex
        }
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/')} style={ThemeService.getButtonStyle('secondary')}>
            <span className="material-icons" style={{ marginRight: '5px' }}>home</span>
            Ana Sayfa
          </button>
          <h1 style={styles.title}>Rapor Şablonları</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          style={ThemeService.getButtonStyle('primary')}
        >
          <span className="material-icons" style={{ marginRight: '5px' }}>add</span>
          Yeni Şablon
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error?.message || 'Şablon işlemleri sırasında bir hata oluştu'}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h2>{selectedTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon'}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Şablon Adı:</label>
              <input
                type="text"
                value={selectedTemplate ? selectedTemplate.name : newTemplate.name}
                onChange={(e) => selectedTemplate ? 
                  setSelectedTemplate({...selectedTemplate, name: e.target.value}) :
                  setNewTemplate({...newTemplate, name: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label>Açıklama:</label>
              <textarea
                value={selectedTemplate ? selectedTemplate.description : newTemplate.description}
                onChange={(e) => selectedTemplate ?
                  setSelectedTemplate({...selectedTemplate, description: e.target.value}) :
                  setNewTemplate({...newTemplate, description: e.target.value})}
                style={{...styles.input, height: '100px'}}
              />
            </div>

            <div style={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedTemplate ? selectedTemplate.isPublic : newTemplate.isPublic}
                  onChange={(e) => selectedTemplate ?
                    setSelectedTemplate({...selectedTemplate, isPublic: e.target.checked}) :
                    setNewTemplate({...newTemplate, isPublic: e.target.checked})}
                />
                Herkese Açık
              </label>
            </div>

            <h3>Stil Ayarları</h3>
            <div style={styles.styleGrid}>
              <div style={styles.styleItem}>
                <label>Yazı Tipi:</label>
                <select
                  value={selectedTemplate ? selectedTemplate.styles.fontFamily : newTemplate.styles.fontFamily}
                  onChange={(e) => selectedTemplate ?
                    setSelectedTemplate({...selectedTemplate, styles: {...selectedTemplate.styles, fontFamily: e.target.value}}) :
                    setNewTemplate({...newTemplate, styles: {...newTemplate.styles, fontFamily: e.target.value}})}
                  style={styles.input}
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                </select>
              </div>

              <div style={styles.styleItem}>
                <label>Başlık Stili:</label>
                <select
                  value={selectedTemplate ? selectedTemplate.styles.headerStyle : newTemplate.styles.headerStyle}
                  onChange={(e) => selectedTemplate ?
                    setSelectedTemplate({...selectedTemplate, styles: {...selectedTemplate.styles, headerStyle: e.target.value}}) :
                    setNewTemplate({...newTemplate, styles: {...newTemplate.styles, headerStyle: e.target.value}})}
                  style={styles.input}
                >
                  <option value="centered">Ortalı</option>
                  <option value="left-aligned">Sola Yaslı</option>
                </select>
              </div>

              <div style={styles.styleItem}>
                <label>Sayfa Boyutu:</label>
                <select
                  value={selectedTemplate ? selectedTemplate.styles.pageSize : newTemplate.styles.pageSize}
                  onChange={(e) => selectedTemplate ?
                    setSelectedTemplate({...selectedTemplate, styles: {...selectedTemplate.styles, pageSize: e.target.value}}) :
                    setNewTemplate({...newTemplate, styles: {...newTemplate.styles, pageSize: e.target.value}})}
                  style={styles.input}
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>

            <h3>Renk Ayarları</h3>
            <div style={styles.colorGrid}>
              {['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor'].map(colorKey => (
                <div key={colorKey} style={styles.colorItem}>
                  <label>{colorKey === 'primaryColor' ? 'Ana Renk' :
                         colorKey === 'secondaryColor' ? 'İkincil Renk' :
                         colorKey === 'accentColor' ? 'Vurgu Rengi' : 'Arka Plan'}</label>
                  <div
                    style={{
                      ...styles.colorPreview,
                      backgroundColor: selectedTemplate ? 
                        selectedTemplate.styles[colorKey] : 
                        newTemplate.styles[colorKey]
                    }}
                    onClick={() => {
                      setActiveColor(colorKey);
                      setShowColorPicker(true);
                    }}
                  />
                </div>
              ))}
            </div>

            {showColorPicker && (
              <div style={styles.colorPicker}>
                <div style={styles.colorPickerOverlay} onClick={() => setShowColorPicker(false)} />
                <div style={styles.colorPickerPopover}>
                  <SketchPicker
                    color={selectedTemplate ? 
                      selectedTemplate.styles[activeColor] : 
                      newTemplate.styles[activeColor]}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
            )}

            <h3>Bölümler</h3>
            <div style={styles.sections}>
              {(selectedTemplate ? selectedTemplate.sections : newTemplate.sections).map((section, index) => (
                <div key={section.name} style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <label>
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => {
                          const sections = [...(selectedTemplate ? selectedTemplate.sections : newTemplate.sections)];
                          sections[index].enabled = e.target.checked;
                          selectedTemplate ?
                            setSelectedTemplate({...selectedTemplate, sections}) :
                            setNewTemplate({...newTemplate, sections});
                        }}
                      />
                      {section.title}
                    </label>
                    <input
                      type="number"
                      value={section.order}
                      onChange={(e) => {
                        const sections = [...(selectedTemplate ? selectedTemplate.sections : newTemplate.sections)];
                        sections[index].order = parseInt(e.target.value);
                        selectedTemplate ?
                          setSelectedTemplate({...selectedTemplate, sections}) :
                          setNewTemplate({...newTemplate, sections});
                      }}
                      style={styles.orderInput}
                      min="1"
                    />
                  </div>
                  
                  {section.enabled && (
                    <div style={styles.sectionContent}>
                      <div style={styles.formGroup}>
                        <label>Üst Başlık İçeriği:</label>
                        <textarea
                          value={section.customContent.header}
                          onChange={(e) => {
                            const sections = [...(selectedTemplate ? selectedTemplate.sections : newTemplate.sections)];
                            sections[index].customContent.header = e.target.value;
                            selectedTemplate ?
                              setSelectedTemplate({...selectedTemplate, sections}) :
                              setNewTemplate({...newTemplate, sections});
                          }}
                          style={{...styles.input, height: '50px'}}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label>Alt Başlık İçeriği:</label>
                        <textarea
                          value={section.customContent.footer}
                          onChange={(e) => {
                            const sections = [...(selectedTemplate ? selectedTemplate.sections : newTemplate.sections)];
                            sections[index].customContent.footer = e.target.value;
                            selectedTemplate ?
                              setSelectedTemplate({...selectedTemplate, sections}) :
                              setNewTemplate({...newTemplate, sections});
                          }}
                          style={{...styles.input, height: '50px'}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.formButtons}>
              <button type="submit" style={ThemeService.getButtonStyle('primary')}>
                {selectedTemplate ? 'Güncelle' : 'Kaydet'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setSelectedTemplate(null);
                }} 
                style={ThemeService.getButtonStyle('secondary')}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.templateGrid}>
        {templates.map(template => (
          <div key={template._id} style={styles.templateCard}>
            <div style={styles.templateHeader}>
              <h3 style={styles.templateTitle}>{template.name}</h3>
              {template.isPublic && (
                <span className="material-icons" style={styles.publicIcon}>public</span>
              )}
            </div>
            <p style={styles.templateDescription}>{template.description}</p>
            <div style={styles.templatePreview}>
              <div style={{
                ...styles.previewBox,
                fontFamily: template.styles.fontFamily,
                backgroundColor: template.styles.backgroundColor,
                color: template.styles.primaryColor
              }}>
                <div style={{
                  textAlign: template.styles.headerStyle,
                  borderBottom: `2px solid ${template.styles.accentColor}`
                }}>
                  Örnek Başlık
                </div>
                <div style={{ color: template.styles.secondaryColor, marginTop: '10px' }}>
                  Örnek İçerik
                </div>
              </div>
            </div>
            <div style={styles.templateActions}>
              <button
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowForm(true);
                }}
                style={ThemeService.getButtonStyle('primary')}
              >
                <span className="material-icons">edit</span>
              </button>
              <button
                onClick={() => handleDelete(template._id)}
                style={ThemeService.getButtonStyle('danger')}
              >
                <span className="material-icons">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: ThemeService.spacing.xl,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeService.spacing.xl,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: ThemeService.spacing.md
  },
  title: {
    margin: 0,
    fontSize: ThemeService.typography.fontSize.h1,
    fontWeight: ThemeService.typography.fontWeight.bold
  },
  formContainer: {
    backgroundColor: ThemeService.colors.light,
    padding: ThemeService.spacing.xl,
    borderRadius: ThemeService.borderRadius.lg,
    marginBottom: ThemeService.spacing.xl,
    boxShadow: ThemeService.shadows.md
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.lg
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.xs
  },
  input: {
    padding: ThemeService.spacing.sm,
    fontSize: ThemeService.typography.fontSize.base,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`,
    width: '100%'
  },
  styleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: ThemeService.spacing.md,
    marginBottom: ThemeService.spacing.lg
  },
  styleItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.xs
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: ThemeService.spacing.md,
    marginBottom: ThemeService.spacing.lg
  },
  colorItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.xs
  },
  colorPreview: {
    width: '100%',
    height: '40px',
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`,
    cursor: 'pointer'
  },
  colorPicker: {
    position: 'relative',
    marginBottom: ThemeService.spacing.lg
  },
  colorPickerOverlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  colorPickerPopover: {
    position: 'absolute',
    zIndex: 2,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.md
  },
  section: {
    backgroundColor: ThemeService.colors.white,
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeService.spacing.sm
  },
  orderInput: {
    width: '60px',
    padding: ThemeService.spacing.xs,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`
  },
  sectionContent: {
    marginTop: ThemeService.spacing.md
  },
  formButtons: {
    display: 'flex',
    gap: ThemeService.spacing.md,
    marginTop: ThemeService.spacing.lg
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: ThemeService.spacing.lg
  },
  templateCard: {
    backgroundColor: ThemeService.colors.white,
    padding: ThemeService.spacing.lg,
    borderRadius: ThemeService.borderRadius.lg,
    boxShadow: ThemeService.shadows.md
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeService.spacing.sm
  },
  templateTitle: {
    margin: 0,
    fontSize: ThemeService.typography.fontSize.lg,
    fontWeight: ThemeService.typography.fontWeight.bold
  },
  publicIcon: {
    color: ThemeService.colors.primary
  },
  templateDescription: {
    margin: `${ThemeService.spacing.xs} 0`,
    color: ThemeService.colors.secondary
  },
  templatePreview: {
    marginTop: ThemeService.spacing.md,
    marginBottom: ThemeService.spacing.lg
  },
  previewBox: {
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`,
    minHeight: '100px'
  },
  templateActions: {
    display: 'flex',
    gap: ThemeService.spacing.sm,
    justifyContent: 'flex-end'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    marginBottom: ThemeService.spacing.md
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    marginBottom: ThemeService.spacing.md
  }
};

export default Templates; 