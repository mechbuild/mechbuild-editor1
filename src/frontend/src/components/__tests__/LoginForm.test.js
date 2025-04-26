import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import LoginForm from '../LoginForm';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
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
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the API call and navigation
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
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
        data: { message: 'Invalid credentials' },
      },
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    // Submit the form without filling in fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check for validation messages
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
}); 