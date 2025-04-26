const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, BorderStyle } = require('docx');
const openaiService = require('./openaiService');
const htmlPdf = require('html-pdf-node');
const fs = require('fs').promises;
const path = require('path');
const TranslationService = require('./translationService');

class ReportService {
  static templates = {
    default: {
      name: 'Varsayılan',
      styles: {
        fontFamily: 'Arial, sans-serif',
        primaryColor: '#333333',
        secondaryColor: '#666666',
        accentColor: '#007bff',
        backgroundColor: '#ffffff',
        headerStyle: 'centered', // centered, left-aligned
        pageSize: 'A4'
      }
    },
    modern: {
      name: 'Modern',
      styles: {
        fontFamily: 'Roboto, sans-serif',
        primaryColor: '#2c3e50',
        secondaryColor: '#7f8c8d',
        accentColor: '#3498db',
        backgroundColor: '#ecf0f1',
        headerStyle: 'left-aligned',
        pageSize: 'A4'
      }
    },
    classic: {
      name: 'Klasik',
      styles: {
        fontFamily: 'Times New Roman, serif',
        primaryColor: '#000000',
        secondaryColor: '#444444',
        accentColor: '#8b0000',
        backgroundColor: '#ffffff',
        headerStyle: 'centered',
        pageSize: 'A4'
      }
    }
  };

  static async loadCustomTemplate(templateId) {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateId}.json`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      return JSON.parse(templateContent);
    } catch (error) {
      console.error(`Template ${templateId} not found, using default`);
      return this.templates.default;
    }
  }

  static async generateReport(project, aiSuggestions, zoneSystems, lang = 'tr') {
    const t = TranslationService.getTranslations(lang);
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: t.title,
                bold: true,
                size: 32
              })
            ],
            spacing: { after: 400 }
          }),

          // Project Info
          new Paragraph(`📌 ${t.project}: ${project.name}`),
          new Paragraph(`📍 ${t.location}: ${project.location}`),
          new Paragraph(`🏗️ ${t.type}: ${project.buildingType}`),
          new Paragraph(`📐 ${t.area}: ${project.area} m²`),
          new Paragraph(`🧱 ${t.floor}: ${project.floorCount}`),
          new Paragraph(" "),

          // AI Suggestions
          new Paragraph({
            text: `🧠 ${t.systems}:`,
            bold: true
          }),
          ...aiSuggestions.map(suggestion => 
            new Paragraph({
              text: `• ${suggestion}`,
              spacing: { before: 200 }
            })
          ),
          new Paragraph(" "),

          // Zone Systems
          ...zoneSystems.map(system => [
            new Paragraph({
              text: system.name,
              bold: true,
              spacing: { before: 400 }
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: t.requirements, bold: true })],
                      width: { size: 25, type: "percentage" }
                    }),
                    new TableCell({
                      children: [new Paragraph(system.requirements)]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: t.justification, bold: true })]
                    }),
                    new TableCell({
                      children: [new Paragraph(system.justification)]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: t.technicalDetails, bold: true })]
                    }),
                    new TableCell({
                      children: [new Paragraph(system.technicalDetails)]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: t.costImpact, bold: true })]
                    }),
                    new TableCell({
                      children: [new Paragraph(system.costImpact)]
                    })
                  ]
                })
              ]
            })
          ]).flat(),

          // Disclaimer
          new Paragraph({
            text: t.disclaimer,
            spacing: { before: 400 },
            style: {
              color: "gray",
              size: 20,
              italic: true
            }
          })
        ]
      }]
    });

    return await ReportService.generateBuffer(doc);
  }

  static async generateBuffer(doc) {
    return await doc.save();
  }

  static async generatePDF(project, aiSuggestions, zoneSystems, templateId = 'default') {
    const template = await this.loadCustomTemplate(templateId) || this.templates[templateId] || this.templates.default;
    const content = this.generateHTMLContent(project, aiSuggestions, zoneSystems, template);
    const options = { format: template.styles.pageSize };
    const file = { content };
    
    return await htmlPdf.generatePdf(file, options);
  }

  static generateHTMLContent(project, aiSuggestions, zoneSystems, template) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: ${template.styles.fontFamily};
              background-color: ${template.styles.backgroundColor};
              color: ${template.styles.primaryColor};
              margin: 40px;
            }
            .header { 
              text-align: ${template.styles.headerStyle === 'centered' ? 'center' : 'left'};
              margin-bottom: 30px;
            }
            .title { 
              font-size: 24px;
              font-weight: bold;
              color: ${template.styles.primaryColor};
            }
            .date { color: ${template.styles.secondaryColor}; }
            .section { margin: 20px 0; }
            .section-title { 
              font-size: 18px;
              font-weight: bold;
              color: ${template.styles.primaryColor};
              border-bottom: 2px solid ${template.styles.accentColor};
              padding-bottom: 5px;
            }
            table { 
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              background-color: ${template.styles.backgroundColor};
            }
            th, td { 
              border: 1px solid ${template.styles.secondaryColor};
              padding: 12px;
              text-align: left;
            }
            th { 
              background-color: ${template.styles.accentColor};
              color: white;
            }
            .suggestion, .system { 
              margin: 10px 0;
              padding: 15px;
              background-color: white;
              border-left: 4px solid ${template.styles.accentColor};
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .disclaimer { 
              margin-top: 30px;
              font-size: 12px;
              color: ${template.styles.secondaryColor};
              border-top: 1px solid ${template.styles.secondaryColor};
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">MECHBUILD TEKNİK RAPOR</div>
            <div class="date">${new Date().toLocaleDateString('tr-TR')}</div>
          </div>

          <div class="section">
            <div class="section-title">PROJE BİLGİLERİ</div>
            <table>
              <tr><th>Proje Adı</th><td>${project.name}</td></tr>
              <tr><th>Lokasyon</th><td>${project.location}</td></tr>
              <tr><th>Bina Tipi</th><td>${project.buildingType}</td></tr>
              <tr><th>Alan</th><td>${project.area} m²</td></tr>
              <tr><th>Kat Sayısı</th><td>${project.floorCount}</td></tr>
              <tr><th>Durum</th><td>${project.status}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">AI SİSTEM ÖNERİLERİ</div>
            ${aiSuggestions.map(suggestion => `
              <div class="suggestion">
                <h3>${suggestion.title}</h3>
                <p><strong>Öncelik:</strong> ${suggestion.priority === 'high' ? 'Yüksek' : 'Orta'}</p>
                <p>${suggestion.description}</p>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">ZON SİSTEMLERİ</div>
            ${zoneSystems.map(system => `
              <div class="system">
                <h3>${system.name}</h3>
                <p><strong>Gereklilik:</strong> ${system.requirementLevel.toUpperCase()}</p>
                <p><strong>Gerekçe:</strong> ${system.reason}</p>
                <p><strong>Teknik Detaylar:</strong> ${system.technicalDetails}</p>
                <p><strong>Maliyet Etkisi:</strong> ${system.costImpact.toUpperCase()}</p>
              </div>
            `).join('')}
          </div>

          <div class="disclaimer">
            Bu rapor yapay zeka destekli bir sistem tarafından otomatik olarak oluşturulmuştur. 
            Öneriler genel nitelikte olup, projenin özel koşullarına göre değişiklik gösterebilir. 
            Nihai kararlar için lütfen uzman görüşüne başvurunuz.
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = ReportService; 