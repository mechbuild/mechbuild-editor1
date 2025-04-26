import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressIndicator from '../ProgressIndicator';
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

describe('ProgressIndicator Component', () => {
    beforeEach(() => {
        render(<ProgressIndicator operationId="test123" />);
    });

    test('shows initial loading state', () => {
        expect(screen.getByText('İşlem başlatılıyor...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('updates progress correctly', async () => {
        await waitFor(() => {
            expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
        });
    });

    test('shows analysis details when expanded', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        await waitFor(() => {
            expect(screen.getByText('Excel Analiz Sonuçları')).toBeInTheDocument();
            expect(screen.getByText('3 Sayfa')).toBeInTheDocument();
            expect(screen.getByText('1,000 Hücre')).toBeInTheDocument();
            expect(screen.getByText('50 Formül')).toBeInTheDocument();
        });
    });

    test('handles error state', async () => {
        server.use(
            rest.get('/api/operation/:id', (req, res, ctx) => {
                return res(ctx.status(500));
            })
        );

        await waitFor(() => {
            expect(screen.getByText('İşlem durumu alınamadı')).toBeInTheDocument();
        });
    });

    test('shows performance metrics', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        await waitFor(() => {
            expect(screen.getByText('Performans Metrikleri')).toBeInTheDocument();
            expect(screen.getByText('Hücre Yoğunluğu')).toBeInTheDocument();
            expect(screen.getByText('Formül Karmaşıklığı')).toBeInTheDocument();
            expect(screen.getByText('Stil Çeşitliliği')).toBeInTheDocument();
        });
    });

    test('shows recommendations', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        await waitFor(() => {
            expect(screen.getByText('İyileştirme Önerileri')).toBeInTheDocument();
        });
    });

    test('handles PDF export', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        const exportButton = screen.getByText('PDF Olarak Dışa Aktar');
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        });
    });

    test('handles view mode changes', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        const detailedViewButton = screen.getByTestId('view-detailed');
        fireEvent.click(detailedViewButton);

        await waitFor(() => {
            expect(screen.getByText('Detaylı Görünüm')).toBeInTheDocument();
        });
    });

    test('handles filter changes', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        const filterInput = screen.getByPlaceholderText('Sayfa Ara...');
        fireEvent.change(filterInput, { target: { value: 'Sheet1' } });

        await waitFor(() => {
            expect(screen.getByText('Sheet1')).toBeInTheDocument();
        });
    });

    test('handles sort changes', async () => {
        const expandButton = screen.getByTestId('expand-button');
        fireEvent.click(expandButton);

        const sortSelect = screen.getByLabelText('Sırala');
        fireEvent.mouseDown(sortSelect);
        const nameOption = screen.getByText('İsim');
        fireEvent.click(nameOption);

        await waitFor(() => {
            expect(screen.getByText('Sheet1')).toBeInTheDocument();
        });
    });
}); 