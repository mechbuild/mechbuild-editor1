import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import UploadForm from '../UploadForm';

describe('UploadForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock localStorage
    localStorage.setItem('token', 'test-token');
  });

  it('renders upload form', () => {
    render(<UploadForm />);

    expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('handles file selection', () => {
    render(<UploadForm />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/choose file/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(input.files[0]).toBe(file);
    expect(input.files).toHaveLength(1);
  });

  it('handles file upload successfully', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        message: 'File uploaded successfully',
        filePath: '/uploads/test.jpg',
      },
    });

    render(<UploadForm />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/choose file/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/upload/profile-picture',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it('handles file upload error', async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Upload failed' },
      },
    });

    render(<UploadForm />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/choose file/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('validates file selection', async () => {
    render(<UploadForm />);

    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/please select a file/i)).toBeInTheDocument();
  });

  it('validates file type', async () => {
    render(<UploadForm />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/choose file/i);

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
  });
}); 