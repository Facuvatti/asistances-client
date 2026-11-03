type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://api.asistances.dpdns.org').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function httpRequest<T = any>(
  endpoint: string,
  method: Method = 'GET',
  body?: Record<string, any>
): Promise<T> {
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  if (endpoint.startsWith('/')) endpoint = endpoint.slice(1);
  const response = await fetch(`${API_URL}/${endpoint}`, options);
  const text = await response.text();
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = text; }
  }
  if (!response.ok) {
    const message = (json && (json.error || json.message)) || `Error ${response.status}`;
    throw new ApiError(response.status, message, json);
  }
  return json as T;
}

/** Mensaje legible de un error de la API (o de red). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Error inesperado';
}

export function buildFormBody(form: HTMLFormElement, optional: string[] = []): Record<string, string> | undefined {
  const formData = new FormData(form);
  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    const trimmed = key !== 'password' ? value.toLowerCase().trim() : value.trim();
    data[key] = trimmed;
  }
  if (Object.entries(data).some(([key, value]) => value === '' && !optional.includes(key))) {
    return undefined;
  }
  return data;
}
