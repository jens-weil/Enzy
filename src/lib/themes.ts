export type ThemeColors = {
  primary: string;
  secondary: string;
  dark: string;
  accent: string;
  light: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  colors: ThemeColors;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "enzymatica",
    name: "Enzymatica Original",
    colors: {
      primary: "#007c91",
      secondary: "#00b4d8",
      dark: "#003a4d",
      accent: "#0288d1",
      light: "#e0f7fa",
    }
  },
  {
    id: "midnight",
    name: "Midnight Dreams",
    colors: {
      primary: "#1e293b",
      secondary: "#3b82f6",
      dark: "#0f172a",
      accent: "#6366f1",
      light: "#f1f5f9",
    }
  },
  {
    id: "forest",
    name: "Deep Forest",
    colors: {
      primary: "#064e3b",
      secondary: "#10b981",
      dark: "#022c22",
      accent: "#34d399",
      light: "#f0fdf4",
    }
  },
  {
    id: "sunset",
    name: "Evening Sunset",
    colors: {
      primary: "#9a3412",
      secondary: "#fbbf24",
      dark: "#431407",
      accent: "#f59e0b",
      light: "#fffbeb",
    }
  },
  {
    id: "royal",
    name: "Royal Amethyst",
    colors: {
      primary: "#581c87",
      secondary: "#a855f7",
      dark: "#2e1065",
      accent: "#c084fc",
      light: "#faf5ff",
    }
  }
];

export const DEFAULT_THEME = THEME_PRESETS[0];
