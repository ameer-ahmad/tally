import { supabase } from './supabase';

const apiUrl =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : import.meta.env.PROD
      ? ''
      : 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  }).catch((err: unknown) => {
    if (!navigator.onLine || err instanceof TypeError) {
      throw new ApiError(0, 'You’re offline. Connect to sync your data.');
    }
    throw err;
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let body: { error?: string } | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as { error?: string };
    } catch {
      throw new ApiError(
        res.status,
        text.startsWith('<!') || text.startsWith('<')
          ? 'API returned a page instead of JSON — check the deploy/API route.'
          : text.slice(0, 200),
      );
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.error || res.statusText || 'Request failed');
  }

  return body as T;
}

export function isOfflineError(err: unknown): boolean {
  return err instanceof TypeError && (err.message === 'Failed to fetch' || !navigator.onLine);
}
