export type ThemeMode = 'light' | 'dark';

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
};
