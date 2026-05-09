import type { Config } from "tailwindcss";

/**
 * Jornada Intensiva — Tokens documentais retrô-sóbrios.
 * Paleta intencionalmente discreta. Sem cores saturadas, sem acentos vivos.
 * Inspiração: papel almaço, prontuário hospitalar, IA Writer, Notion sóbrio.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Off-whites de papel
        paper: {
          50: "#fbf9f4",   // base de fundo (ligeiro creme)
          100: "#f6f2ea",  // cards/folhas
          200: "#ebe5d8",  // bordas claras
          300: "#d9d2c2",  // bordas medias
          400: "#b9b0a0",  // texto secundário sobre paper
        },
        // Tinta — escala de cinza-grafite com leve calor
        ink: {
          900: "#1c1a17",  // títulos
          800: "#2a2723",
          700: "#3a3631",
          600: "#4d4842",
          500: "#6a635a",  // texto corpo
          400: "#8a8278",
          300: "#a9a195",  // texto auxiliar
          200: "#c9c2b6",
          100: "#e5e0d6",
        },
        // Sépia para acentos discretos (nunca vibrante)
        sepia: {
          600: "#7a5a2c",  // links / interativo principal
          500: "#8b6a3a",
          400: "#a5854f",
        },
        // Sinalização clínica — usar com PARCIMÔNIA, nunca como decoração
        clinical: {
          alert: "#9a3b2c",   // divergência / alerta crítico
          warn:  "#a06b1f",   // pendência
          ok:    "#3e6a3e",   // confirmado / estável
        },
      },
      fontFamily: {
        // Serif para títulos e elementos documentais
        serif: ["var(--font-serif)", "'Iowan Old Style'", "Georgia", "serif"],
        // Sans clean para corpo
        sans:  ["var(--font-sans)", "system-ui", "sans-serif"],
        // Monospace tipo máquina de escrever para metadados/laboratório
        mono:  ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Escala documental contida
        "doc-xs":  ["0.75rem",  { lineHeight: "1.1rem" }],
        "doc-sm":  ["0.8125rem", { lineHeight: "1.2rem" }],
        "doc-base":["0.9375rem", { lineHeight: "1.55rem" }],
        "doc-lg":  ["1.0625rem", { lineHeight: "1.6rem" }],
        "doc-h2":  ["1.25rem",   { lineHeight: "1.6rem" }],
        "doc-h1":  ["1.625rem",  { lineHeight: "1.9rem" }],
      },
      letterSpacing: {
        "doc": "0.01em",
        "doc-tight": "-0.01em",
      },
      borderRadius: {
        // Cantos quase retos — sensação documental
        sheet: "2px",
        chip:  "1px",
      },
      boxShadow: {
        // Sombras minimalistas; nunca dramáticas
        sheet: "0 1px 0 0 rgba(28, 26, 23, 0.04), 0 0 0 1px rgba(28, 26, 23, 0.06)",
        inset: "inset 0 0 0 1px rgba(28, 26, 23, 0.08)",
      },
      spacing: {
        margin: "2.25rem", // margem documental
      },
    },
  },
  plugins: [],
} satisfies Config;
