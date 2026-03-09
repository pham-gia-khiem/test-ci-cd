const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  requestId: string | null;
  durationMs: number;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message =
      payload && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message
        : 'Request failed';
    throw new Error(message);
  }

  if (!payload || !('data' in payload)) {
    throw new Error('Invalid server response');
  }

  return payload.data;
}
