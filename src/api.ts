type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function httpRequest<T = any>(
  endpoint: string,
  method: Method = 'GET',
  body?: Record<string, any>
): Promise<T> {
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}/${endpoint}`, options);
  const json = await response.json();
  return json as T;
}

export function buildFormBody(form: HTMLFormElement): Record<string, string> | undefined {
  const formData = new FormData(form);
  const data: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    const trimmed = key !== 'password' ? value.toLowerCase().trim() : value.trim();
    data[key] = trimmed;
  }

  if (Object.values(data).some((value) => value === '')) {
    return undefined;
  }

  return data;
}
