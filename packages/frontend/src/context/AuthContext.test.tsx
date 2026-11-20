import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import React from 'react';

// Mock axios
vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../api/client';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('starts with user as null and loading false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // After initial useEffect runs
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it('restores user from localStorage', async () => {
    const mockUser = { id: 'u1', email: 'test@test.com', full_name: 'Test', role: 'customer' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('accessToken', 'token123');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);
  });

  it('login sets user and stores tokens', async () => {
    const mockResponse = {
      data: {
        user: { id: 'u1', email: 'a@a.com', full_name: 'Admin', role: 'admin' },
        accessToken: 'at',
        refreshToken: 'rt',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a@a.com', 'password');
    });

    expect(result.current.user?.email).toBe('a@a.com');
    expect(localStorage.getItem('accessToken')).toBe('at');
    expect(localStorage.getItem('refreshToken')).toBe('rt');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockResponse.data.user);
  });

  it('logout clears user and storage', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('accessToken', 'at');
    localStorage.setItem('refreshToken', 'rt');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('register sets user and stores tokens', async () => {
    const mockResponse = {
      data: {
        user: { id: 'u2', email: 'new@test.com', full_name: 'New', role: 'customer' },
        accessToken: 'at2',
        refreshToken: 'rt2',
      },
    };
    (api.post as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({ email: 'new@test.com', password: 'pw', full_name: 'New' });
    });

    expect(result.current.user?.email).toBe('new@test.com');
    expect(localStorage.getItem('accessToken')).toBe('at2');
  });
});
