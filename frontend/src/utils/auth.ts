export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // JWT exp в секундах
      const now = Date.now();
      
      if (now >= expirationTime) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token:  string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return isTokenValid(token);
};