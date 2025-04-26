import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import RegisterForm from '../RegisterForm';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders register form', () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { email: 'test@example.com' },
      },
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the API call and navigation
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/register',
        {
          email: 'test@example.com',
          password: 'password123',
        }
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles form submission with error', async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Email already exists' },
      },
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    // Fill in the form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password456' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for validation message
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    // Submit the form without filling in fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check for validation messages
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
  });
}); 