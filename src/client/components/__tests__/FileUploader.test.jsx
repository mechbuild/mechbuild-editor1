import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '../FileUploader';
import { server } from '../../../setupTests';

describe('FileUploader Component', () => {
    const mockOnUploadComplete = jest.fn();

    beforeEach(() => {
        render(<FileUploader onUploadComplete={mockOnUploadComplete} />);
    });

    test('renders dropzone correctly', () => {
        expect(screen.getByText('Excel dosyasını sürükleyip bırakın')).toBeInTheDocument();
        expect(screen.getByText('veya')).toBeInTheDocument();
        expect(screen.getByText('tıklayarak seçin')).toBeInTheDocument();
    });

    test('handles file selection via click', async () => {
        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('test.xlsx')).toBeInTheDocument();
        });
    });

    test('handles file drag and drop', async () => {
        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const dropzone = screen.getByTestId('dropzone');

        fireEvent.dragEnter(dropzone);
        fireEvent.dragOver(dropzone);
        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByText('test.xlsx')).toBeInTheDocument();
        });
    });

    test('shows error for invalid file type', async () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('Sadece Excel dosyaları (.xlsx) yüklenebilir')).toBeInTheDocument();
        });
    });

    test('handles file upload', async () => {
        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        const uploadButton = screen.getByText('Yükle');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByText('Dosya yükleniyor...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(mockOnUploadComplete).toHaveBeenCalled();
        });
    });

    test('handles upload errors', async () => {
        server.use(
            rest.post('/api/upload', (req, res, ctx) => {
                return res(ctx.status(500));
            })
        );

        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        const uploadButton = screen.getByText('Yükle');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByText('Dosya yüklenirken bir hata oluştu')).toBeInTheDocument();
        });
    });

    test('allows file removal', async () => {
        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        const removeButton = screen.getByTestId('remove-file');
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByText('test.xlsx')).not.toBeInTheDocument();
        });
    });

    test('shows progress indicator during upload', async () => {
        const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const input = screen.getByTestId('file-input');
        
        fireEvent.change(input, { target: { files: [file] } });

        const uploadButton = screen.getByText('Yükle');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    test('handles multiple file selection in batch mode', async () => {
        render(<FileUploader onUploadComplete={mockOnUploadComplete} batchMode={true} />);

        const files = [
            new File(['test1'], 'test1.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            new File(['test2'], 'test2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        ];

        const input = screen.getByTestId('file-input');
        fireEvent.change(input, { target: { files } });

        await waitFor(() => {
            expect(screen.getByText('test1.xlsx')).toBeInTheDocument();
            expect(screen.getByText('test2.xlsx')).toBeInTheDocument();
        });
    });
}); 