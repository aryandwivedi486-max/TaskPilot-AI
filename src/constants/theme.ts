/**
 * TaskPilot AI
 * Design System & Style Tokens (Material Design 3 Inspired Dark Theme)
 */

export const THEME = {
  colors: {
    // Premium dark backgrounds
    background: {
      default: '#0B0F19', // Deep space dark background
      paper: '#131B2E',      // Dark slate for cards and panels
      elevated: '#1E294B',   // Slightly lighter indigo-slate for active/focused elements
      inset: '#070A10',      // Deepest black for field backgrounds
    },
    // Core accent colors
    primary: {
      main: '#4F46E5',       // Primary indigo
      hover: '#6366F1',
      light: '#818CF8',
    },
    accent: {
      blue: '#0EA5E9',       // Actionable highlights
      blueHover: '#38BDF8',
    },
    // Contextual status colors
    status: {
      success: '#10B981',    // Emerald Green
      warning: '#F59E0B',    // Amber Yellow
      danger: '#EF4444',     // Coral Red
      info: '#0EA5E9',       // Sky Blue
    },
    // Priority specific shades (with high contrast)
    priority: {
      low: { bg: '#10B98120', text: '#34D399', border: '#10B98140', name: 'Low' },
      medium: { bg: '#3B82F620', text: '#60A5FA', border: '#3B82F640', name: 'Medium' },
      high: { bg: '#F59E0B20', text: '#FBBF24', border: '#F59E0B40', name: 'High' },
      critical: { bg: '#EF444420', text: '#F87171', border: '#EF444440', name: 'Critical' },
    },
    // High contrast typography colors
    text: {
      primary: '#F9FAFB',    // High-emphasis white
      secondary: '#9CA3AF',  // Medium-emphasis grey
      disabled: '#6B7280',   // Low-emphasis grey
      muted: '#4B5563',      // Darker border-like grey
    }
  },
  // High-craft smooth transitions & micro-interactions
  transitions: {
    default: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-300 ease-in-out',
  },
  // Premium rounded corner tokens matching Material Design 3 (18-22px)
  radius: {
    card: 'rounded-[20px]',     // Main cards and dialogs
    button: 'rounded-[12px]',   // Buttons and interactive controls
    pill: 'rounded-full',       // Badges and status indicators
  },
  // Desktop-first precision, mobile-first responsive layout rules
  layout: {
    sidebarWidth: 'w-64',
    sidebarCompactWidth: 'w-20',
    containerMax: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  }
};
