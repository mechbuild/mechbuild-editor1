import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import PerformanceReport from '../PerformanceReport';

// Mock axios
jest.mock('axios');

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

describe('PerformanceReport', () => {
  const mockReportData = {
    summary: {
      cpu: {
        average: 50,
        max: 80,
        min: 30
      },
      memory: {
        average: 60,
        max: 90,
        min: 40
      },
      responseTime: {
        average: 100,
        max: 200,
        min: 50
      }
    },
    trends: [
      {
        timestamp: new Date().toISOString(),
        cpu: 50,
        memory: 60,
        responseTime: 100
      }
    ],
    alerts: [
      {
        timestamp: new Date().toISOString(),
        type: 'high_cpu',
        message: 'CPU kullanımı yüksek',
        recommendation: 'CPU kullanımını azaltmak için öneriler'
      }
    ]
  };

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockReportData });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<PerformanceReport />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render report data after loading', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });
  });

  it('should handle time range change', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const timeRangeSelect = screen.getByLabelText('Zaman Aralığı');
    fireEvent.mouseDown(timeRangeSelect);
    const option = screen.getByText('Son 7 Gün');
    fireEvent.click(option);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('range=7d'),
      expect.any(Object)
    );
  });

  it('should handle report type change', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const reportTypeSelect = screen.getByLabelText('Rapor Tipi');
    fireEvent.mouseDown(reportTypeSelect);
    const option = screen.getByText('Detaylı Rapor');
    fireEvent.click(option);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('type=detailed'),
      expect.any(Object)
    );
  });

  it('should handle refresh button click', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Raporu Yenile');
    fireEvent.click(refreshButton);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('should handle download button click', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    axios.get.mockResolvedValueOnce({ data: mockReportData })
      .mockResolvedValueOnce({ data: mockBlob });

    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const downloadButton = screen.getByTitle('Raporu İndir');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/report/export'),
        expect.any(Object)
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Rapor verileri alınırken hata oluştu')).toBeInTheDocument();
    });
  });

  it('should render summary report correctly', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Özeti')).toBeInTheDocument();
      expect(screen.getByText('CPU Kullanımı')).toBeInTheDocument();
      expect(screen.getByText('Bellek Kullanımı')).toBeInTheDocument();
      expect(screen.getByText('Yanıt Süresi')).toBeInTheDocument();
    });
  });

  it('should render alerts report correctly', async () => {
    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const reportTypeSelect = screen.getByLabelText('Rapor Tipi');
    fireEvent.mouseDown(reportTypeSelect);
    const option = screen.getByText('Uyarı Raporu');
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.getByText('Uyarı ve Öneriler')).toBeInTheDocument();
      expect(screen.getByText('CPU kullanımı yüksek')).toBeInTheDocument();
    });
  });

  it('should update charts when data changes', async () => {
    const newData = {
      ...mockReportData,
      trends: [
        {
          timestamp: new Date().toISOString(),
          cpu: 70,
          memory: 80,
          responseTime: 150
        }
      ]
    };

    axios.get.mockResolvedValueOnce({ data: mockReportData })
      .mockResolvedValueOnce({ data: newData });

    render(<PerformanceReport />);
    await waitFor(() => {
      expect(screen.getByText('Performans Raporu')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Raporu Yenile');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
}); 