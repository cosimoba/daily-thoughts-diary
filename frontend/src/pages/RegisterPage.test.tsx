import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

// mock auth store used by the component
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ register: vi.fn(), isLoading: false })
}));

describe('RegisterPage', () => {
  it('renders sign in link with correct text', () => {
    const html = renderToString(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(html).toContain('sign in to an existing account');
  });
});
