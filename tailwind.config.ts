import type { Config } from "tailwindcss";

/**
 * ============================================================================
 * MADAR Platform - Tailwind CSS Configuration
 * ============================================================================
 * An AI-powered career guidance platform with bilingual Arabic/English support
 * and full RTL (Right-to-Left) layout implementation.
 *
 * Design System: Scandinavian-inspired whitespace with generous spacing,
 * rounded corners, and a sage green primary palette.
 * ============================================================================
 */

const config: Config = {
  // --------------------------------------------------------------------------
  // Content Paths — Next.js App Router
  // --------------------------------------------------------------------------
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // --------------------------------------------------------------------------
  // Dark Mode — Class-based strategy for manual theme toggling
  // --------------------------------------------------------------------------
  darkMode: "class",

  // --------------------------------------------------------------------------
  // RTL Support — Enable logical property variants for bidirectional layouts
  // --------------------------------------------------------------------------
  corePlugins: {
    // Ensure logical properties are available for RTL support
  },

  // --------------------------------------------------------------------------
  // Theme Extensions — MADAR Design System Tokens
  // --------------------------------------------------------------------------
  theme: {
    // ------------------------------------------------------------------------
    // Container Configuration
    // ------------------------------------------------------------------------
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
    },

    // ------------------------------------------------------------------------
    // Breakpoints — Responsive breakpoints aligned with design system
    // ------------------------------------------------------------------------
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    // ------------------------------------------------------------------------
    // Color Palette — Complete MADAR color system
    // ------------------------------------------------------------------------
    extend: {
      colors: {
        // Primary — Wise Green (CTAs, accents, success, active states)
        "wise-green": {
          DEFAULT: "#9fe870",
          hover: "#8dd960",
          light: "#e8f5e0",
        },

        // Background — Page and surface backgrounds
        background: "#e8ebe6",
        surface: {
          DEFAULT: "#ffffff",
          elevated: "#f5f6f4",
        },

        // Text — Primary, secondary, muted, and inverse text colors
        "text-primary": "#0e0f0c",
        "text-secondary": "#5a5c56",
        "text-muted": "#8a8c86",
        "text-inverse": "#ffffff",

        // Border — Default and focus ring borders
        border: {
          DEFAULT: "#d1d4ce",
          focus: "#9fe870",
        },

        // Semantic Colors — Feedback and status indicators
        error: {
          DEFAULT: "#dc2626",
          light: "#fef2f2",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fffbeb",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#eff6ff",
        },

        // Dark mode surface overrides
        dark: {
          background: "#0e0f0c",
          surface: {
            DEFAULT: "#1a1b18",
            elevated: "#242522",
          },
          "text-primary": "#f5f6f4",
          "text-secondary": "#a0a29c",
          "text-muted": "#6a6c66",
          border: {
            DEFAULT: "#3a3c36",
            focus: "#9fe870",
          },
        },
      },

      // ----------------------------------------------------------------------
      // Typography — Font families, sizes, weights, letter-spacing, line-height
      // ----------------------------------------------------------------------
      fontFamily: {
        heading: ["'Wise Sans'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },

      fontWeight: {
        medium: "500",
        semibold: "600",
        bold: "700",
        black: "900",
      },

      fontSize: {
        // Heading scale (h1–h6)
        "heading-1": [
          "3rem",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            fontWeight: "900",
          },
        ],
        "heading-2": [
          "2.25rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.015em",
            fontWeight: "900",
          },
        ],
        "heading-3": [
          "1.75rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.01em",
            fontWeight: "900",
          },
        ],
        "heading-4": [
          "1.375rem",
          {
            lineHeight: "1.3",
            letterSpacing: "-0.005em",
            fontWeight: "700",
          },
        ],
        "heading-5": [
          "1.125rem",
          {
            lineHeight: "1.4",
            fontWeight: "700",
          },
        ],
        "heading-6": [
          "1rem",
          {
            lineHeight: "1.4",
            fontWeight: "700",
          },
        ],

        // Body text scale
        "body-xl": [
          "1.125rem",
          {
            lineHeight: "1.6",
            fontWeight: "600",
          },
        ],
        "body-lg": [
          "1rem",
          {
            lineHeight: "1.6",
            fontWeight: "600",
          },
        ],
        "body-base": [
          "0.875rem",
          {
            lineHeight: "1.5",
            fontWeight: "600",
          },
        ],
        "body-sm": [
          "0.8125rem",
          {
            lineHeight: "1.5",
            fontWeight: "500",
          },
        ],
        "body-xs": [
          "0.75rem",
          {
            lineHeight: "1.4",
            fontWeight: "500",
          },
        ],
      },

      lineHeight: {
        tighter: "1.1",
        tight: "1.2",
        snug: "1.3",
        normal: "1.4",
        relaxed: "1.6",
      },

      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.015em",
        snug: "-0.01em",
        slight: "-0.005em",
        normal: "0",
        wide: "0.01em",
      },

      // ----------------------------------------------------------------------
      // Spacing — Extended scale for generous Scandinavian whitespace
      // ----------------------------------------------------------------------
      spacing: {
        // Section vertical padding helpers
        section: "80px",
        "section-lg": "120px",

        // Card internal padding
        "card-padding": "24px",

        // Card gap
        "card-gap": "20px",

        // Extended micro spacing for fine-grained layouts
        "2.5": "0.625rem", // 10px
        "3.5": "0.875rem", // 14px
        "4.5": "1.125rem", // 18px
        "13": "3.25rem", // 52px
        "15": "3.75rem", // 60px
        "18": "4.5rem", // 72px
        "22": "5.5rem", // 88px
        "26": "6.5rem", // 104px
        "30": "7.5rem", // 120px (section-lg)
      },

      // ----------------------------------------------------------------------
      // Border Radius — Soft, rounded Scandinavian aesthetic
      // ----------------------------------------------------------------------
      borderRadius: {
        card: "24px",
        button: "16px",
        pill: "9999px",
        input: "12px",
        badge: "9999px",
        "2xl": "16px",
        "3xl": "24px",
      },

      // ----------------------------------------------------------------------
      // Shadows — Elevation system with consistent color tint
      // ----------------------------------------------------------------------
      boxShadow: {
        card: "0 2px 12px rgba(14, 15, 12, 0.06)",
        elevated: "0 4px 24px rgba(14, 15, 12, 0.08)",
        dropdown: "0 8px 32px rgba(14, 15, 12, 0.12)",
        focus: "0 0 0 3px rgba(159, 232, 112, 0.3)",
        "focus-error": "0 0 0 3px rgba(220, 38, 38, 0.3)",
        "focus-info": "0 0 0 3px rgba(59, 130, 246, 0.3)",
        "focus-warning": "0 0 0 3px rgba(245, 158, 11, 0.3)",
      },

      // ----------------------------------------------------------------------
      // Transitions — Custom easing curves for Framer Motion & CSS transitions
      // ----------------------------------------------------------------------
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      transitionDuration: {
        "50": "50ms",
        "150": "150ms",
        "250": "250ms",
        "350": "350ms",
        "450": "450ms",
      },

      // ----------------------------------------------------------------------
      // Z-Index — Layered stacking context
      // ----------------------------------------------------------------------
      zIndex: {
        behind: "-1",
        dropdown: "100",
        sticky: "200",
        overlay: "300",
        modal: "400",
        toast: "500",
        tooltip: "600",
      },

      // ----------------------------------------------------------------------
      // Opacity — Extended opacity scale
      // ----------------------------------------------------------------------
      opacity: {
        "2": "0.02",
        "4": "0.04",
        "6": "0.06",
        "8": "0.08",
        "12": "0.12",
        "85": "0.85",
        "92": "0.92",
      },

      // ----------------------------------------------------------------------
      // Keyframe Animations
      // ----------------------------------------------------------------------
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(-8px)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },

      animation: {
        "fade-in": "fade-in 300ms ease-smooth forwards",
        "fade-in-up": "fade-in-up 400ms ease-out-expo forwards",
        "fade-in-down": "fade-in-down 400ms ease-out-expo forwards",
        "scale-in": "scale-in 250ms ease-out-expo forwards",
        "slide-in-right": "slide-in-right 400ms ease-out-expo forwards",
        "slide-in-left": "slide-in-left 400ms ease-out-expo forwards",
        shimmer: "shimmer 2s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        bounce: "bounce 1s ease-in-out infinite",
      },

      // ----------------------------------------------------------------------
      // Background Image / Gradient Utilities
      // ----------------------------------------------------------------------
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(159,232,112,0.08) 50%, transparent 100%)",
      },

      // ----------------------------------------------------------------------
      // Backdrop Blur — Glassmorphism support
      // ----------------------------------------------------------------------
      backdropBlur: {
        xs: "2px",
      },
    },
  },

  // --------------------------------------------------------------------------
  // Plugins
  // --------------------------------------------------------------------------
  plugins: [
    /**
     * RTL Plugin — Adds `rtl:` variant for Right-to-Left layout support.
     * When the document has `dir="rtl"`, utilities prefixed with `rtl:`
     * will take precedence. This enables bidirectional Arabic/English layouts.
     */
    function ({ addVariant }: { addVariant: (name: string, matcher: string) => void }) {
      addVariant("rtl", '&[dir="rtl"] &');
      addVariant("ltr", '&[dir="ltr"] &');
      addVariant("group-rtl", ':merge(.group)[dir="rtl"] &');
      addVariant("peer-rtl", ':merge(.peer)[dir="rtl"] ~ &');
    },

    /**
     * Custom utilities for the MADAR design system.
     */
    function ({ addUtilities, addComponents }: {
      addUtilities: (utilities: Record<string, Record<string, string>>) => void;
      addComponents: (components: Record<string, Record<string, string>>) => void;
    }) {
      // Typography utilities for heading/body shortcuts
      addUtilities({
        ".text-balance": {
          textWrap: "balance",
        },
        ".text-pretty": {
          textWrap: "pretty",
        },
      });

      // Layout utilities for RTL-safe logical properties
      addUtilities({
        ".margin-start": {
          marginInlineStart: "var(--ms-spacing, 0)",
        },
        ".margin-end": {
          marginInlineEnd: "var(--me-spacing, 0)",
        },
        ".padding-start": {
          paddingInlineStart: "var(--ps-spacing, 0)",
        },
        ".padding-end": {
          paddingInlineEnd: "var(--pe-spacing, 0)",
        },
        ".border-start": {
          borderInlineStartWidth: "var(--bs-width, 1px)",
        },
        ".border-end": {
          borderInlineEndWidth: "var(--be-width, 1px)",
        },
        ".rounded-start": {
          borderStartStartRadius: "var(--rss-radius, 0)",
          borderEndStartRadius: "var(--res-radius, 0)",
        },
        ".rounded-end": {
          borderStartEndRadius: "var(--rse-radius, 0)",
          borderEndEndRadius: "var(--ree-radius, 0)",
        },
        ".inset-start": {
          insetInlineStart: "var(--is-position, auto)",
        },
        ".inset-end": {
          insetInlineEnd: "var(--ie-position, auto)",
        },
      });

      // Component patterns — reusable card/button base styles
      addComponents({
        ".card": {
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(14, 15, 12, 0.06)",
        },
        ".card-elevated": {
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 4px 24px rgba(14, 15, 12, 0.08)",
        },
        ".btn-primary": {
          backgroundColor: "#9fe870",
          color: "#0e0f0c",
          borderRadius: "16px",
          fontWeight: "600",
          padding: "12px 24px",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          transition:
            "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".btn-pill": {
          backgroundColor: "#9fe870",
          color: "#0e0f0c",
          borderRadius: "9999px",
          fontWeight: "600",
          padding: "12px 24px",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          transition:
            "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      });
    },
  ],

  // --------------------------------------------------------------------------
  // Safelist — Utilities that should never be purged
  // --------------------------------------------------------------------------
  safelist: [
    // Direction classes for RTL toggling
    "ltr",
    "rtl",
    // Typography utilities
    "text-heading-1",
    "text-heading-2",
    "text-heading-3",
    "text-heading-4",
    "text-heading-5",
    "text-heading-6",
    "text-body-xl",
    "text-body-lg",
    "text-body-base",
    "text-body-sm",
    "text-body-xs",
    // Focus ring variants
    "shadow-focus",
    "shadow-focus-error",
    "shadow-focus-info",
    "shadow-focus-warning",
    // Animation utilities
    "animate-fade-in",
    "animate-fade-in-up",
    "animate-scale-in",
    "animate-shimmer",
    // Dark mode utilities
    "dark",
  ],
};

export default config;
