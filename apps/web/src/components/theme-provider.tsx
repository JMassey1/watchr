import { ThemeProvider as NextThemesProvider } from "next-themes";
import type {ThemePreset} from "@watch3r/db/schema/user";
import * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export { useTheme } from "next-themes";

export function ThemePresetProvider({preset}: {preset: ThemePreset}) {
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.themePreset = preset;

    return () => {
      delete root.dataset.themePreset;
    };
  }, [preset])

  return null;
}
