import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('App', () => {
  it('validates a URL before submitting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ links: [] }) }));
    render(<App />);
    fireEvent.change(screen.getByLabelText(/paste your long url/i), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: /shorten url/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/complete url/i);
  });

  it('shows the shortened result', async () => {
    const link = { code: 'abc123', originalUrl: 'https://example.com/long', shortUrl: 'http://localhost:5000/abc123', createdAt: '2026-09-28' };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => link }));
    render(<App />);
    fireEvent.change(screen.getByLabelText(/paste your long url/i), { target: { value: link.originalUrl } });
    fireEvent.click(screen.getByRole('button', { name: /shorten url/i }));
    await waitFor(() => expect(screen.getAllByText(link.shortUrl)).toHaveLength(2));
    expect(JSON.parse(localStorage.getItem('sniply.recentLinks'))).toEqual([link]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

it('loads only browser history without requesting a public list', () => {
  localStorage.setItem('sniply.recentLinks', JSON.stringify([
    { code: 'local', originalUrl: 'https://example.com', shortUrl: 'https://short.example/local' }
  ]));
  vi.stubGlobal('fetch', vi.fn());
  render(<App />);
  expect(screen.getByText('https://short.example/local')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

it('handles corrupt browser history', () => {
  localStorage.setItem('sniply.recentLinks', '{');
  render(<App />);
  expect(screen.getByText(/Your latest shortened links/)).toBeInTheDocument();
});
