import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import ErrorService from './errorService';

class ExportService {
  static async exportToExcel(data, fileName) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `${fileName}_${timestamp}.xlsx`);
      
      return true;
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Export Excel');
      throw new Error(errorResponse.message);
    }
  }

  static async exportToPDF(data, fileName) {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(fileName, 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
      
      // Add table
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(header => item[header]));
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 }
      });
      
      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      return true;
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Export PDF');
      throw new Error(errorResponse.message);
    }
  }

  static async exportProjects(projects) {
    await this.exportToExcel(projects, 'Projects');
    await this.exportToPDF(projects, 'Projects');
  }

  static async exportReports(reports) {
    await this.exportToExcel(reports, 'Reports');
    await this.exportToPDF(reports, 'Reports');
  }

  static async exportSettings(settings) {
    await this.exportToExcel(settings, 'Settings');
    await this.exportToPDF(settings, 'Settings');
  }
}

export default ExportService; 