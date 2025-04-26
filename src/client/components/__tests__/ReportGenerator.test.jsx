import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportGenerator from '../ReportGenerator';
import { server } from '../../../setupTests';

const mockAnalysis = {
    totalSheets: 3,
    totalCells: 1000,
    totalFormulas: 50,
    totalCharts: 2,
    totalPivotTables: 1,
    complexityScore: 65,
    sheets: [
        {
            name: 'Sheet1',
            rowCount: 100,
            columnCount: 10,
            cells: {
                total: 1000,
                withData: 500,
                withFormulas: 50,
                withStyles: 200,
                empty: 500
            },
            charts: [
                { type: 'bar', name: 'Chart1' }
            ],
            pivotTables: [
                { name: 'Pivot1' }
            ]
        }
    ]
};

describe('ReportGenerator Component', () => {
    beforeEach(() => {
        render(<ReportGenerator operationId="test123" analysis={mockAnalysis} />);
    });

    test('renders all tabs correctly', () => {
        expect(screen.getByText('Genel')).toBeInTheDocument();
        expect(screen.getByText('Önizleme')).toBeInTheDocument();
        expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });

    test('allows changing report title', () => {
        const titleInput = screen.getByLabelText('Rapor Başlığı');
        fireEvent.change(titleInput, { target: { value: 'Yeni Rapor Başlığı' } });
        expect(titleInput.value).toBe('Yeni Rapor Başlığı');
    });

    test('allows changing report format', () => {
        const formatSelect = screen.getByLabelText('Rapor Formatı');
        fireEvent.mouseDown(formatSelect);
        const htmlOption = screen.getByText('HTML');
        fireEvent.click(htmlOption);
        expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    test('shows preview content correctly', async () => {
        const previewTab = screen.getByText('Önizleme');
        fireEvent.click(previewTab);

        await waitFor(() => {
            expect(screen.getByText('Rapor Önizleme')).toBeInTheDocument();
            expect(screen.getByText('3 Sayfa')).toBeInTheDocument();
            expect(screen.getByText('1,000 Hücre')).toBeInTheDocument();
            expect(screen.getByText('50 Formül')).toBeInTheDocument();
        });
    });

    test('allows toggling report sections', () => {
        const settingsTab = screen.getByText('Ayarlar');
        fireEvent.click(settingsTab);

        const chartsCheckbox = screen.getByLabelText('Grafikler ve Pivot Tablolar');
        const formulasCheckbox = screen.getByLabelText('Formül Analizi');
        const stylesCheckbox = screen.getByLabelText('Stil Analizi');

        fireEvent.click(chartsCheckbox);
        fireEvent.click(formulasCheckbox);
        fireEvent.click(stylesCheckbox);

        expect(chartsCheckbox.checked).toBe(false);
        expect(formulasCheckbox.checked).toBe(false);
        expect(stylesCheckbox.checked).toBe(false);
    });

    test('handles report generation', async () => {
        const generateButton = screen.getByText('Raporu İndir');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Rapor Oluşturuluyor...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Raporu İndir')).toBeInTheDocument();
        });
    });

    test('handles API errors gracefully', async () => {
        server.use(
            rest.post('/api/export-analysis/:id', (req, res, ctx) => {
                return res(ctx.status(500));
            })
        );

        const generateButton = screen.getByText('Raporu İndir');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(screen.getByText('Rapor oluşturma başarısız oldu')).toBeInTheDocument();
        });
    });

    test('updates preview when settings change', async () => {
        const settingsTab = screen.getByText('Ayarlar');
        fireEvent.click(settingsTab);

        const chartsCheckbox = screen.getByLabelText('Grafikler ve Pivot Tablolar');
        fireEvent.click(chartsCheckbox);

        const previewTab = screen.getByText('Önizleme');
        fireEvent.click(previewTab);

        await waitFor(() => {
            expect(screen.queryByText('Grafikler ve Pivot Tablolar')).not.toBeInTheDocument();
        });
    });

    test('handles file download', async () => {
        const generateButton = screen.getByText('Raporu İndir');
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        });
    });
}); 