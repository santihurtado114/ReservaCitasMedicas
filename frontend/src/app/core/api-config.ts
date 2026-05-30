export function resolveApiBaseUrl(): string {
  if (
    window.location.hostname === 'localhost' &&
    window.location.port === '4200'
  ) {
    return 'http://localhost:3000';
  }

  return 'https://reservacitasmedicas.onrender.com';
}

export const API_BASE_URL = resolveApiBaseUrl();
