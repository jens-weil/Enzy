"use client";

import { useEffect, useState } from "react";
import { fetchSettingsOnce } from "@/lib/settingsCache";
import { THEME_PRESETS, ThemeColors } from "@/lib/themes";

export default function ThemeVariableInjector({ initialColors }: { initialColors?: ThemeColors }) {
  const [colors, setColors] = useState<ThemeColors | null>(initialColors || null);

  const applyColors = () => {
    fetchSettingsOnce().then(data => {
      if (data?.theme?.colors) {
        setColors(data.theme.colors);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    // Always fetch the actual saved settings on mount to ensure client-side settings
    // override any stale build-time initialColors from static SSR pages.
    applyColors();
    
    window.addEventListener('settingsUpdated', applyColors);
    return () => window.removeEventListener('settingsUpdated', applyColors);
  }, []);

  if (!colors) return null;

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --brand-primary: ${colors.primary};
          --brand-secondary: ${colors.secondary};
          --brand-dark: ${colors.dark};
          --brand-accent: ${colors.accent};
          --brand-light: ${colors.light};
        }
      `
    }} />
  );
}
