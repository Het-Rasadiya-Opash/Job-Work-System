import { createContext, useMemo, useState } from "react";
import { createTheme } from "@mui/material/styles";

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  const stored = localStorage.getItem("themeMode");
  const [mode, setMode] = useState(stored || "light");

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          localStorage.setItem("themeMode", next);
          return next;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: { main: "#4F46E5", light: "#818CF8", dark: "#3730A3", contrastText: "#fff" },
                secondary: { main: "#10B981", light: "#34D399", dark: "#059669" },
                background: { default: "#FAFBFC", paper: "#FFFFFF" },
                text: { primary: "#111827", secondary: "#6B7280", disabled: "#9CA3AF" },
                divider: "rgba(0,0,0,0.06)",
                grey: { 50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 300: "#D1D5DB", 400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151", 800: "#1F2937", 900: "#111827" },
                action: { hover: "rgba(0,0,0,0.03)", selected: "rgba(79, 70, 229, 0.06)", focus: "rgba(79, 70, 229, 0.12)" },
                success: { main: "#10B981", light: "#D1FAE5", dark: "#059669" },
                warning: { main: "#F59E0B", light: "#FEF3C7", dark: "#D97706" },
                error: { main: "#EF4444", light: "#FEE2E2", dark: "#DC2626" },
                info: { main: "#3B82F6", light: "#DBEAFE", dark: "#2563EB" },
              }
            : {
                primary: { main: "#818CF8", light: "#A5B4FC", dark: "#6366F1", contrastText: "#fff" },
                secondary: { main: "#34D399", light: "#6EE7B7", dark: "#10B981" },
                background: { default: "#0B0F1A", paper: "#111827" },
                text: { primary: "#F9FAFB", secondary: "#9CA3AF", disabled: "#6B7280" },
                divider: "rgba(255,255,255,0.06)",
                grey: { 50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 300: "#D1D5DB", 400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151", 800: "#1F2937", 900: "#111827" },
                action: { hover: "rgba(255,255,255,0.04)", selected: "rgba(129, 140, 248, 0.08)", focus: "rgba(129, 140, 248, 0.16)" },
                success: { main: "#34D399", light: "#064E3B", dark: "#10B981" },
                warning: { main: "#FBBF24", light: "#78350F", dark: "#F59E0B" },
                error: { main: "#F87171", light: "#7F1D1D", dark: "#EF4444" },
                info: { main: "#60A5FA", light: "#1E3A5F", dark: "#3B82F6" },
              }),
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          h1: { fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.025em", lineHeight: 1.2 },
          h2: { fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.025em", lineHeight: 1.25 },
          h3: { fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em", lineHeight: 1.3 },
          h4: { fontWeight: 700, fontSize: "1.125rem", letterSpacing: "-0.02em", lineHeight: 1.3 },
          h5: { fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.01em" },
          h6: { fontWeight: 600, fontSize: "0.875rem", letterSpacing: "-0.01em" },
          subtitle1: { fontWeight: 600, fontSize: "0.875rem", letterSpacing: "-0.006em" },
          subtitle2: { fontWeight: 600, fontSize: "0.8125rem" },
          body1: { fontSize: "0.875rem", lineHeight: 1.6 },
          body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
          caption: { fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.02em" },
          overline: { fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" },
          button: { textTransform: "none", fontWeight: 600, fontSize: "0.8125rem", letterSpacing: "-0.006em" },
        },
        shape: { borderRadius: 8 },
        shadows: [
          "none",
          "0 1px 2px 0 rgba(0,0,0,0.03)",
          "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
          "0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -2px rgba(0,0,0,0.03)",
          "0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -4px rgba(0,0,0,0.02)",
          "0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.03)",
          ...Array(19).fill("0 25px 50px -12px rgba(0,0,0,0.08)"),
        ],
        transitions: {
          duration: { shortest: 120, shorter: 160, short: 200, standard: 240, complex: 300 },
          easing: { sharp: "cubic-bezier(0.4, 0, 0.2, 1)" },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              "*": { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
              "::selection": { backgroundColor: "rgba(79, 70, 229, 0.15)", color: "inherit" },
              body: { overscrollBehavior: "none" },
            },
          },
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: "7px 16px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.5,
                transition: "all 0.15s ease",
              },
              contained: ({ theme: t }) => ({
                "&:hover": {
                  boxShadow: `0 4px 12px ${t.palette.mode === "dark" ? "rgba(129,140,248,0.25)" : "rgba(79,70,229,0.25)"}`,
                  transform: "translateY(-0.5px)",
                },
                "&:active": { transform: "translateY(0)" },
              }),
              outlined: ({ theme: t }) => ({
                borderColor: t.palette.divider,
                "&:hover": {
                  borderColor: t.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                  backgroundColor: t.palette.action.hover,
                },
              }),
              text: {
                "&:hover": { backgroundColor: "transparent", opacity: 0.8 },
              },
              sizeSmall: { padding: "4px 12px", fontSize: "0.75rem" },
            },
          },
          MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
              root: ({ theme: t }) => ({
                backgroundImage: "none",
                border: `1px solid ${t.palette.divider}`,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
              }),
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme: t }) => ({
                borderRadius: 12,
                border: `1px solid ${t.palette.divider}`,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  borderColor: t.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                },
              }),
            },
          },
          MuiTextField: {
            defaultProps: { variant: "outlined", size: "small" },
            styleOverrides: {
              root: ({ theme: t }) => ({
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  transition: "all 0.15s ease",
                  "& fieldset": {
                    borderColor: t.palette.divider,
                    transition: "border-color 0.15s ease",
                  },
                  "&:hover fieldset": {
                    borderColor: t.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: t.palette.primary.main,
                    borderWidth: "1.5px",
                    boxShadow: `0 0 0 3px ${t.palette.mode === "dark" ? "rgba(129,140,248,0.1)" : "rgba(79,70,229,0.08)"}`,
                  },
                },
                "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
              }),
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { fontWeight: 600, letterSpacing: "0.01em" },
              sizeSmall: { height: 22, fontSize: "0.6875rem" },
            },
            variants: [
              {
                props: { variant: "tonal", color: "success" },
                style: ({ theme: t }) => ({
                  backgroundColor: t.palette.mode === "dark" ? "rgba(52, 211, 153, 0.12)" : "#D1FAE5",
                  color: t.palette.mode === "dark" ? "#6EE7B7" : "#065F46",
                  "&:hover": { backgroundColor: t.palette.mode === "dark" ? "rgba(52, 211, 153, 0.2)" : "#A7F3D0" },
                }),
              },
              {
                props: { variant: "tonal", color: "error" },
                style: ({ theme: t }) => ({
                  backgroundColor: t.palette.mode === "dark" ? "rgba(248, 113, 113, 0.12)" : "#FEE2E2",
                  color: t.palette.mode === "dark" ? "#FCA5A5" : "#991B1B",
                  "&:hover": { backgroundColor: t.palette.mode === "dark" ? "rgba(248, 113, 113, 0.2)" : "#FECACA" },
                }),
              },
              {
                props: { variant: "tonal", color: "warning" },
                style: ({ theme: t }) => ({
                  backgroundColor: t.palette.mode === "dark" ? "rgba(251, 191, 36, 0.12)" : "#FEF3C7",
                  color: t.palette.mode === "dark" ? "#FCD34D" : "#92400E",
                  "&:hover": { backgroundColor: t.palette.mode === "dark" ? "rgba(251, 191, 36, 0.2)" : "#FDE68A" },
                }),
              },
              {
                props: { variant: "tonal", color: "info" },
                style: ({ theme: t }) => ({
                  backgroundColor: t.palette.mode === "dark" ? "rgba(96, 165, 250, 0.12)" : "#DBEAFE",
                  color: t.palette.mode === "dark" ? "#93C5FD" : "#1E40AF",
                  "&:hover": { backgroundColor: t.palette.mode === "dark" ? "rgba(96, 165, 250, 0.2)" : "#BFDBFE" },
                }),
              },
              {
                props: { variant: "tonal", color: "primary" },
                style: ({ theme: t }) => ({
                  backgroundColor: t.palette.mode === "dark" ? "rgba(129, 140, 248, 0.12)" : "#EEF2FF",
                  color: t.palette.mode === "dark" ? "#A5B4FC" : "#3730A3",
                  "&:hover": { backgroundColor: t.palette.mode === "dark" ? "rgba(129, 140, 248, 0.2)" : "#E0E7FF" },
                }),
              },
            ],
          },
          MuiDialog: {
            styleOverrides: {
              paper: ({ theme: t }) => ({
                borderRadius: 12,
                border: `1px solid ${t.palette.divider}`,
                boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
              }),
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                fontSize: "0.75rem",
                fontWeight: 500,
                borderRadius: 6,
                padding: "5px 10px",
                backgroundColor: "#111827",
                color: "#F3F4F6",
              },
              arrow: { color: "#111827" },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: { borderRadius: 8, fontSize: "0.8125rem" },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: { transition: "all 0.15s ease" },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: { transition: "all 0.15s ease" },
            },
          },
          MuiSwitch: {
            styleOverrides: {
              root: { padding: 7 },
            },
          },
          MuiSkeleton: {
            styleOverrides: {
              root: ({ theme: t }) => ({
                backgroundColor: t.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              }),
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: ({ theme: t }) => ({
                borderRadius: 10,
                border: `1px solid ${t.palette.divider}`,
                boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
                marginTop: 4,
              }),
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: { fontSize: "0.8125rem", borderRadius: 6, margin: "2px 4px" },
            },
          },
        },
      }),
    [mode]
  );

  return { colorMode, theme };
}
