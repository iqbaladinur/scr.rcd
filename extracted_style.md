# FlowTrack Landing Page - Design System Knowledgebase

> **Version**: 1.0
> **Last Updated**: 2025-11-13
> **Project**: FlowTrack Landing Page
> **Framework**: React + TailwindCSS

This document serves as a comprehensive knowledgebase for the FlowTrack design system, extractable for use in other projects.

---

## 📋 Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing & Layout](#3-spacing--layout)
4. [Borders & Shadows](#4-borders--shadows)
5. [Animations & Transitions](#5-animations--transitions)
6. [Component Patterns](#6-component-patterns)
7. [Responsive Design](#7-responsive-design)
8. [Quick Reference](#8-quick-reference)

---

## 1. Color Palette

### 1.1 Primary Color System

#### Base Dark Theme (Slate)
```css
/* Background Hierarchy */
bg-slate-950    /* #020617 - Deepest background */
bg-slate-900    /* #0f172a - Primary background, cards */
bg-slate-800    /* #1e293b - Elevated surfaces */
bg-slate-700    /* #334155 - Hover states */

/* Text Hierarchy */
text-white      /* Primary text */
text-slate-300  /* #cbd5e1 - Secondary text */
text-slate-400  /* #94a3b8 - Tertiary text */
text-slate-500  /* #64748b - Disabled text */
```

#### Brand Colors (Green Accent)
```css
/* Primary Green Scale */
green-300: #86efac  /* Light green for gradients */
green-400: #4ade80  /* Bright accent for text */
green-500: #22c55e  /* Primary brand color */
green-600: #16a34a  /* Dark accent, logo background */

/* Usage Examples */
bg-gradient-to-r from-green-400 to-green-600  /* Primary CTA */
bg-gradient-to-r from-green-300 to-green-500  /* Hero text gradient */
text-green-400                                 /* Accent text */
border-green-500/30                            /* Subtle borders */
```

#### Supporting Colors

**Cyan (Secondary Accent)**
```css
cyan-400: #22d3ee   /* Badge text */
cyan-500: #06b6d4   /* Badge borders */
/* Usage: bg-cyan-500/10 border-cyan-500/20 text-cyan-400 */
```

**Semantic Colors**
```css
/* Success (Income) */
success-400: #34d399
success-500: #10b981
success-600: #059669

/* Warning (Alerts) */
warning-400: #fbbf24
warning-500: #f59e0b
warning-700: #b45309

/* Error (Expenses) */
error-400: #f87171
error-500: #ef4444
error-600: #dc2626
```

### 1.2 Opacity Scale

Consistent opacity values for layering and depth:

```css
/10  /* 10% - Very subtle backgrounds (bg-green-500/10) */
/20  /* 20% - Light overlays, borders (border-white/20) */
/30  /* 30% - Medium borders (border-green-500/30) */
/40  /* 40% - Stronger borders (border-green-500/40) */
/50  /* 50% - Active states (bg-white/50) */
/60  /* 60% - Hover states (border-green-500/60) */
/70  /* 70% - Highlight states (border-green-500/70) */
```

### 1.3 Color Application Matrix

| Element | Default | Hover | Active |
|---------|---------|-------|--------|
| **Primary Button** | `from-green-400 to-green-600` | `shadow-green-500/60 scale-[1.02]` | — |
| **Card Border** | `border-green-500/30` | `border-green-500/50` | `border-green-500/70` |
| **Card Shadow** | `shadow-green-500/20` | `shadow-green-500/40` | — |
| **Icon Background** | `from-green-500/20 to-green-600/20` | `scale-110` | — |
| **Text Accent** | `text-green-400` | `text-green-300` | — |

---

## 2. Typography

### 2.1 Font Families

```css
/* Primary Font Stack */
font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont,
             "Segoe UI", sans-serif;

/* Monospace (Code, Numbers) */
font-family: "IBM Plex Mono", "Courier New", monospace;
```

**Implementation in Tailwind:**
```javascript
// tailwind.config.js
theme: {
  fontFamily: {
    sans: ['"IBM Plex Sans"', 'sans-serif'],
    mono: ['"IBM Plex Mono"', 'monospace'],
  }
}
```

### 2.2 Type Scale

| Usage | Classes | Size | Weight | Line Height |
|-------|---------|------|--------|-------------|
| **Hero Title** | `text-5xl lg:text-7xl font-bold` | 48px → 72px | 700 | tight |
| **Section Title** | `text-4xl lg:text-5xl font-bold` | 36px → 48px | 700 | tight |
| **Subsection** | `text-3xl font-bold` | 30px | 700 | tight |
| **Card Title** | `text-2xl font-semibold` | 24px | 600 | normal |
| **Feature Title** | `text-xl font-semibold` | 20px | 600 | normal |
| **Body Large** | `text-xl` | 20px | 400 | relaxed |
| **Body** | `text-base` | 16px | 400 | normal |
| **Body Small** | `text-sm` | 14px | 400 | normal |
| **Caption** | `text-xs` | 12px | 400 | normal |

### 2.3 Font Weights

```css
font-normal    /* 400 - Body text */
font-medium    /* 500 - Subtle emphasis */
font-semibold  /* 600 - Labels, subheadings, buttons */
font-bold      /* 700 - Headings, CTAs */
```

### 2.4 Text Treatments

**Gradient Text (Brand Feature)**
```html
<span class="bg-gradient-to-r from-green-400 to-green-600
             bg-clip-text text-transparent">
  Highlighted Text
</span>
```

**Monospace Numbers (Financial Data)**
```html
<span class="font-mono font-semibold">$1,234.56</span>
```

---

## 3. Spacing & Layout

### 3.1 Spacing Scale (based on 4px)

```css
/* Padding */
p-2   /* 8px */
p-3   /* 12px */
p-4   /* 16px */
p-6   /* 24px */
p-8   /* 32px */
p-12  /* 48px */

/* Margin */
m-2, m-3, m-4, m-6, m-8, m-12, m-16

/* Gap (Flex/Grid) */
gap-2, gap-3, gap-4, gap-6, gap-8, gap-12
```

### 3.2 Section Padding

```css
/* Vertical Section Spacing */
py-16  /* 64px - Small sections */
py-24  /* 96px - Standard sections */
py-32  /* 128px - Large sections (Hero, Final CTA) */

/* Horizontal Container Padding */
px-6   /* 24px - Mobile & Desktop */
```

### 3.3 Container Widths

```css
max-w-7xl  /* 1280px - Main content container */
max-w-6xl  /* 1152px - Medium container */
max-w-5xl  /* 1024px - Narrow container */
max-w-4xl  /* 896px - Content sections */
max-w-3xl  /* 768px - Narrow content */
max-w-2xl  /* 672px - Quotes, callouts */
max-w-xl   /* 576px - Forms */
```

### 3.4 Grid Systems

**Benefits Grid (3 columns)**
```html
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Comparison Grid (2 columns)**
```html
<div class="grid lg:grid-cols-2 gap-8">
```

**Stats Grid (4 columns)**
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
```

---

## 4. Borders & Shadows

### 4.1 Border System

**Border Widths**
```css
border     /* 1px - Subtle dividers */
border-2   /* 2px - Standard cards */
border-4   /* 4px - Section accents */
border-l-4 /* Left accent on headers */
```

**Border Colors & Opacity**
```css
/* Neutral Borders */
border-white/10     /* Very subtle */
border-white/20     /* Subtle glass effect */

/* Brand Borders */
border-green-500/20  /* Light */
border-green-500/30  /* Default cards */
border-green-500/40  /* Medium */
border-green-500/50  /* Hover state */
border-green-500/60  /* Active hover */
border-green-500/70  /* Highlighted */

/* Semantic Borders */
border-red-500/40    /* Error/comparison */
border-yellow-500/40 /* Warning/comparison */
border-cyan-500/20   /* Badge borders */
```

**Border Radius**
```css
rounded-lg    /* 8px - Buttons, small cards */
rounded-xl    /* 12px - Medium cards, icons */
rounded-2xl   /* 16px - Large cards, containers */
rounded-3xl   /* 24px - Hero sections */
rounded-full  /* Circle - Badges, avatars */
```

### 4.2 Shadow System

**Shadow Pattern (Green-tinted)**
```css
/* Light Shadow */
shadow-lg shadow-green-500/20
/* Usage: Default cards, subtle depth */

/* Medium Shadow */
shadow-xl shadow-green-500/30
/* Usage: Elevated cards, hover states */

/* Strong Shadow */
shadow-2xl shadow-green-500/40
/* Usage: Highlighted cards, CTAs */

/* Maximum Shadow */
shadow-2xl shadow-green-500/60
/* Usage: Active buttons, max emphasis */
```

**Special Shadow Effects**
```css
/* Custom glow effect on hover */
hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]

/* Semantic shadows */
shadow-red-500/20    /* Error cards */
shadow-yellow-500/20 /* Warning cards */
shadow-white/20      /* Glass buttons */
```

### 4.3 Combined Border + Shadow Pattern

**Standard Card**
```html
<div class="border-2 border-green-500/30 shadow-lg shadow-green-500/20
            hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/30">
```

**Highlighted Card**
```html
<div class="border-2 border-green-500/70 shadow-2xl shadow-green-500/40
            hover:shadow-[0_0_40px_rgba(34,197,94,0.5)]">
```

---

## 5. Animations & Transitions

### 5.1 Tailwind Config Custom Animations

```javascript
// tailwind.config.js
theme: {
  extend: {
    animation: {
      'slide-up': 'slideUp 0.3s ease-out',
      'slide-down': 'slideDown 0.3s ease-out',
      'fade-in': 'fadeIn 0.2s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
    },
    keyframes: {
      slideUp: {
        '0%': { transform: 'translateY(100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-100%)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
  }
}
```

### 5.2 Built-in Animations

```css
/* Pulse (Glowing effects) */
animate-pulse
/* Usage: Badge dot, background glows */

/* Transition Classes */
transition-all         /* Smooth all-property transition */
transition-colors      /* Color changes only */
transition-transform   /* Scale/translate only */
transition-opacity     /* Fade effects */
transition-shadow      /* Shadow changes */

/* Durations */
duration-200  /* 0.2s - Quick interactions */
duration-300  /* 0.3s - Standard (default) */
duration-500  /* 0.5s - Smooth, noticeable */

/* Timing Functions */
ease-in-out   /* Standard easing */
ease-out      /* Deceleration (preferred) */
```

### 5.3 Common Animation Patterns

**Card Hover Effect**
```html
<div class="transition-all duration-300
            hover:scale-[1.02] hover:border-green-500/50">
```

**Button Hover with Icon Shift**
```html
<button class="group transition-all">
  <span>Button Text</span>
  <ArrowRight class="group-hover:translate-x-1 transition-transform" />
</button>
```

**Icon Scale on Hover**
```html
<div class="group">
  <div class="transition-all group-hover:scale-110">
    <Icon />
  </div>
</div>
```

**Glow Effect Background**
```html
<div class="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600
            rounded-2xl blur-3xl opacity-30 animate-pulse">
</div>
```

**Mobile Sidebar Slide**
```html
<aside class="fixed transition-transform duration-300
              ${open ? 'translate-x-0' : 'translate-x-full'}">
```

---

## 6. Component Patterns

### 6.1 Button Patterns

**Primary CTA Button**
```html
<a href="#" class="group px-6 py-3
                   bg-gradient-to-r from-green-400 to-green-600
                   rounded-lg font-semibold
                   hover:shadow-xl hover:shadow-green-500/60
                   hover:scale-[1.02] transition-all
                   flex items-center gap-2">
  Start Tracking Now
  <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</a>
```

**Secondary Glass Button**
```html
<a href="#" class="px-6 py-3
                   bg-white/5 backdrop-blur-sm
                   border border-white/20 hover:border-green-500/50
                   rounded-lg font-semibold
                   hover:bg-white/10
                   hover:shadow-lg hover:shadow-white/20
                   transition-all
                   flex items-center gap-2">
  <Github class="w-5 h-5" />
  Self-Host FlowTrack
</a>
```

**Ghost Button**
```html
<button class="px-4 py-2
               text-green-400 hover:text-green-300
               border-2 border-green-500/30 hover:border-green-500/60
               rounded-lg
               hover:shadow-lg hover:shadow-green-500/30
               transition-all">
  Back to Home
</button>
```

### 6.2 Card Patterns

**Standard Feature Card**
```html
<div class="group relative
            bg-slate-900/50 backdrop-blur-sm
            border-2 border-green-500/30
            rounded-2xl p-8
            hover:border-green-500/50
            shadow-lg shadow-green-500/20
            hover:shadow-xl hover:shadow-green-500/30
            hover:scale-[1.02]
            transition-all">
  <!-- Card content -->
</div>
```

**Highlighted/Premium Card**
```html
<div class="relative
            bg-gradient-to-br from-green-500/10 to-green-600/10
            border-2 border-green-500/70
            rounded-2xl p-8
            ring-2 ring-green-500/30
            shadow-2xl shadow-green-500/40
            hover:shadow-[0_0_40px_rgba(34,197,94,0.5)]
            hover:scale-[1.02] hover:border-green-500
            transition-all">
  <!-- Premium content -->
</div>
```

**Comparison Card (Alternative Color)**
```html
<!-- Red for negative comparison -->
<div class="bg-slate-900/50
            border-2 border-red-500/40
            rounded-2xl p-8
            shadow-lg shadow-red-500/20
            hover:border-red-500/60
            transition-all">
  <!-- Spreadsheet alternative -->
</div>

<!-- Yellow for warning -->
<div class="bg-slate-900/50
            border-2 border-yellow-500/40
            rounded-2xl p-8
            shadow-lg shadow-yellow-500/20
            hover:border-yellow-500/60
            transition-all">
  <!-- SaaS alternative -->
</div>
```

**Content Card with Prose**
```html
<div class="prose prose-invert prose-lg max-w-none
            bg-slate-900/50
            border-2 border-green-500/30
            rounded-xl p-8
            shadow-xl shadow-green-500/20
            hover:border-green-500/50
            hover:shadow-2xl hover:shadow-green-500/30
            transition-all">
  <!-- Long-form content with typography -->
</div>
```

### 6.3 Badge Patterns

**Primary Badge (Cyan)**
```html
<div class="inline-flex items-center gap-2
            px-4 py-2 rounded-full
            bg-cyan-500/10 border border-cyan-500/20
            text-cyan-400 text-sm font-medium">
  <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
  Self-hosted finance freedom
</div>
```

**Green Badge**
```html
<div class="inline-flex items-center gap-2
            px-4 py-2 rounded-full
            bg-green-500/10 border-2 border-green-500/40
            text-green-400 text-sm font-medium
            shadow-lg shadow-green-500/30">
  Feature Badge
</div>
```

**Gradient Badge (Premium)**
```html
<div class="px-4 py-2
            bg-gradient-to-r from-green-500 to-green-600
            rounded-full text-sm font-semibold
            shadow-lg text-white">
  Most Private
</div>
```

### 6.4 Icon Container Patterns

**Small Icon (10x10 = 40px)**
```html
<div class="size-10 rounded-xl
            bg-gradient-to-br from-blue-400 to-blue-600
            flex items-center justify-center
            shadow">
  <Icon class="w-5 h-5 text-white" />
</div>
```

**Medium Icon with Border (12x12 = 48px)**
```html
<div class="w-12 h-12 rounded-xl
            bg-gradient-to-br from-green-500/20 to-green-600/20
            border-2 border-green-500/40
            flex items-center justify-center
            group-hover:scale-110
            group-hover:shadow-lg group-hover:shadow-green-500/50
            transition-all">
  <Icon class="w-6 h-6 text-green-400" />
</div>
```

**Large Icon (14x14 = 56px)**
```html
<div class="w-14 h-14 rounded-2xl
            bg-gradient-to-br from-green-500/20 to-green-600/20
            border-2 border-green-500/50
            flex items-center justify-center
            shadow-lg shadow-green-500/40">
  <Icon class="w-7 h-7 text-green-400" />
</div>
```

**Avatar Circle**
```html
<div class="w-12 h-12 rounded-full
            bg-gradient-to-br from-green-500 to-green-600
            flex items-center justify-center
            shadow-md shadow-green-500/50
            font-bold text-white">
  JD
</div>
```

### 6.5 Background Pattern

**Gradient Section Background**
```html
<section class="relative">
  <!-- Main gradient -->
  <div class="absolute inset-0
              bg-gradient-to-br from-green-300/20 via-slate-950 to-green-500/20">
  </div>

  <!-- Radial overlays -->
  <div class="absolute inset-0
              bg-[radial-gradient(circle_at_30%_20%,rgba(173,255,47,0.15),transparent_50%)]">
  </div>
  <div class="absolute inset-0
              bg-[radial-gradient(circle_at_70%_80%,rgba(173,255,47,0.15),transparent_50%)]">
  </div>

  <!-- Content -->
  <div class="relative">
    <!-- Section content here -->
  </div>
</section>
```

**Glow Effect Behind Element**
```html
<div class="relative">
  <!-- Glowing background -->
  <div class="absolute inset-0
              bg-gradient-to-r from-green-400 to-green-600
              rounded-2xl blur-3xl opacity-30 animate-pulse">
  </div>

  <!-- Actual content -->
  <div class="relative bg-slate-900/50 backdrop-blur-xl
              border-2 border-green-500/30
              rounded-2xl p-6">
    <!-- Content -->
  </div>
</div>
```

### 6.6 Code Block Pattern (with Copy Button)

```html
<div class="relative group">
  <pre class="!mb-0"><code>npm install</code></pre>

  <button class="absolute top-2 right-2 p-2
                 bg-slate-800/80 hover:bg-slate-700
                 rounded-md
                 opacity-0 group-hover:opacity-100
                 transition-opacity
                 border border-green-500/30 hover:border-green-500/60">
    <Copy class="w-4 h-4 text-slate-400" />
  </button>
</div>
```

---

## 7. Responsive Design

### 7.1 Breakpoints

```javascript
// tailwind.config.js default
screens: {
  'sm': '640px',   // Small devices (rarely used in this project)
  'md': '768px',   // Tablets, 2-column grids
  'lg': '1024px',  // Desktops, 3-column grids, sidebar visible
  'xl': '1280px',  // Large screens
}
```

### 7.2 Common Responsive Patterns

**Typography Scaling**
```html
<!-- Mobile 48px → Desktop 72px -->
<h1 class="text-5xl lg:text-7xl font-bold">

<!-- Mobile 36px → Desktop 48px -->
<h2 class="text-4xl lg:text-5xl font-bold">

<!-- Mobile 24px → Desktop 30px -->
<h3 class="text-2xl lg:text-3xl font-bold">
```

**Grid Responsiveness**
```html
<!-- 1 column → 2 columns → 3 columns -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- 1 column → 2 columns -->
<div class="grid lg:grid-cols-2 gap-8">

<!-- 2 columns → 4 columns -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
```

**Flexbox Stacking**
```html
<!-- Stack vertically on mobile, horizontal on desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Always wrap when needed -->
<div class="flex flex-wrap gap-4">
```

**Visibility Control**
```html
<!-- Hide on mobile, show on desktop -->
<div class="hidden lg:block">

<!-- Show on mobile, hide on desktop -->
<div class="lg:hidden">

<!-- Grid on desktop only -->
<div class="hidden lg:grid lg:grid-cols-3">
```

**Mobile Sidebar Pattern**
```html
<aside class="fixed top-0 right-0 w-80 h-full
              transition-transform duration-300
              ${open ? 'translate-x-0' : 'translate-x-full'}
              lg:translate-x-0">
  <!-- Always visible on desktop, slides in on mobile -->
</aside>
```

**Content Margin for Sidebar**
```html
<div class="lg:mr-80 px-6 max-w-7xl mx-auto">
  <!-- No margin on mobile, 320px margin on desktop for sidebar -->
</div>
```

---

## 8. Quick Reference

### 8.1 Color Quick Copy

```css
/* Backgrounds */
bg-slate-950        /* Deep background */
bg-slate-900        /* Primary surface */
bg-slate-900/50     /* Transparent card */

/* Gradients */
bg-gradient-to-r from-green-400 to-green-600    /* Primary CTA */
bg-gradient-to-r from-green-300 to-green-500    /* Text gradient */
bg-gradient-to-br from-green-500/10 to-green-600/10  /* Card bg */

/* Borders */
border-2 border-green-500/30    /* Default card */
border-2 border-green-500/70    /* Highlighted card */
border border-white/20          /* Glass effect */

/* Shadows */
shadow-lg shadow-green-500/20   /* Subtle depth */
shadow-xl shadow-green-500/30   /* Medium depth */
shadow-2xl shadow-green-500/40  /* Strong depth */

/* Text Colors */
text-green-400      /* Accent text */
text-slate-300      /* Secondary text */
text-slate-400      /* Tertiary text */
```

### 8.2 Component Quick Start

**Button**
```html
<a href="#" class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-600
                   rounded-lg font-semibold hover:shadow-xl
                   hover:shadow-green-500/60 hover:scale-[1.02] transition-all">
  Click Me
</a>
```

**Card**
```html
<div class="bg-slate-900/50 border-2 border-green-500/30 rounded-2xl p-8
            shadow-lg shadow-green-500/20 hover:border-green-500/50
            hover:shadow-xl hover:shadow-green-500/30 transition-all">
  Content
</div>
```

**Badge**
```html
<span class="inline-flex items-center gap-2 px-4 py-2 rounded-full
             bg-cyan-500/10 border border-cyan-500/20 text-cyan-400
             text-sm font-medium">
  Badge
</span>
```

**Icon Container**
```html
<div class="w-12 h-12 rounded-xl
            bg-gradient-to-br from-green-500/20 to-green-600/20
            border-2 border-green-500/40
            flex items-center justify-center">
  <Icon class="w-6 h-6 text-green-400" />
</div>
```

### 8.3 Tailwind Config Essentials

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

### 8.4 Design Principles

1. **Dark-First Theme**: Slate-950/900 base with green accents
2. **Consistent Opacity**: Use /10 to /70 scale for layering
3. **Green-Tinted Shadows**: All shadows use `shadow-green-500/[opacity]`
4. **Hover Scaling**: `hover:scale-[1.02]` for cards/buttons
5. **Glass Morphism**: `bg-white/5 backdrop-blur-sm` for secondary buttons
6. **Gradient Buttons**: Primary CTAs always use green gradient
7. **Border Hierarchy**: 30% default → 50% hover → 70% active
8. **Icon Scaling**: Icons scale to 110% on group hover
9. **Smooth Transitions**: `transition-all` on interactive elements
10. **Mobile-First**: Always design for mobile, enhance for desktop

---

## 9. Common Patterns Library

### 9.1 Section Template

```html
<section class="relative py-24 bg-slate-900 overflow-hidden">
  <!-- Background Effects -->
  <div class="absolute inset-0
              bg-gradient-to-br from-green-500/10 via-slate-900 to-green-600/10">
  </div>
  <div class="absolute inset-0
              bg-[radial-gradient(circle_at_50%_50%,rgba(173,255,47,0.1),transparent_70%)]">
  </div>

  <!-- Content -->
  <div class="relative max-w-7xl mx-auto px-6">
    <!-- Section Badge -->
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-green-500/10 border-2 border-green-500/40
                text-green-400 text-sm font-medium mb-6
                shadow-lg shadow-green-500/30">
      Section Badge
    </div>

    <!-- Section Title -->
    <h2 class="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
      Section Title
      <span class="bg-gradient-to-r from-green-400 to-green-600
                   bg-clip-text text-transparent">
        Highlighted
      </span>
    </h2>

    <!-- Section Description -->
    <p class="text-xl text-slate-300 mb-12 max-w-2xl leading-relaxed">
      Section description text goes here.
    </p>

    <!-- Section Content -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Cards or content -->
    </div>
  </div>
</section>
```

### 9.2 Comparison Table Pattern

```html
<div class="grid lg:grid-cols-3 gap-6">
  <!-- Alternative 1 (Red) -->
  <div class="bg-slate-900/50 border-2 border-red-500/40
              rounded-2xl p-8 shadow-lg shadow-red-500/20">
    <h3 class="text-2xl font-bold mb-4">Spreadsheets</h3>
    <ul class="space-y-3 text-slate-400">
      <li class="flex items-start gap-2">
        <X class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        Negative point
      </li>
    </ul>
  </div>

  <!-- Alternative 2 (Yellow) -->
  <div class="bg-slate-900/50 border-2 border-yellow-500/40
              rounded-2xl p-8 shadow-lg shadow-yellow-500/20">
    <h3 class="text-2xl font-bold mb-4">SaaS Apps</h3>
    <ul class="space-y-3 text-slate-400">
      <li class="flex items-start gap-2">
        <X class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        Warning point
      </li>
    </ul>
  </div>

  <!-- FlowTrack (Green - Highlighted) -->
  <div class="relative bg-gradient-to-br from-green-500/10 to-green-600/10
              border-2 border-green-500/70 rounded-2xl p-8
              ring-2 ring-green-500/30
              shadow-2xl shadow-green-500/40">
    <!-- "Most Private" badge -->
    <div class="absolute -top-3 left-1/2 -translate-x-1/2
                px-4 py-2 bg-gradient-to-r from-green-500 to-green-600
                rounded-full text-sm font-semibold shadow-lg">
      Most Private
    </div>

    <h3 class="text-2xl font-bold mb-4 mt-2">FlowTrack</h3>
    <ul class="space-y-3 text-slate-300">
      <li class="flex items-start gap-2">
        <Check class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        Positive point
      </li>
    </ul>
  </div>
</div>
```

### 9.3 Testimonial Card Pattern

```html
<div class="relative bg-slate-950/50 border-2 border-green-500/30
            rounded-2xl p-8 shadow-lg shadow-green-500/20
            hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/30
            transition-all">
  <!-- Quote Icon -->
  <div class="absolute -top-4 -left-4 w-10 h-10 rounded-xl
              bg-gradient-to-br from-green-500 to-green-600
              shadow-lg shadow-green-500/50
              flex items-center justify-center">
    <Quote class="w-5 h-5 text-white" />
  </div>

  <!-- Testimonial Text -->
  <p class="text-slate-300 mb-6 leading-relaxed italic">
    "Testimonial quote goes here. This is what the user said about
    the product or service."
  </p>

  <!-- Author -->
  <div class="flex items-center gap-3">
    <!-- Avatar -->
    <div class="w-12 h-12 rounded-full
                bg-gradient-to-br from-green-500 to-green-600
                flex items-center justify-center
                shadow-md shadow-green-500/50
                font-bold text-white">
      JD
    </div>
    <!-- Info -->
    <div>
      <p class="font-semibold text-white">John Doe</p>
      <p class="text-sm text-slate-400">Freelance Developer</p>
    </div>
  </div>
</div>
```

---

## 10. Export Instructions

### 10.1 For New Projects

**Step 1: Install Dependencies**
```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography
npx tailwindcss init -p
```

**Step 2: Copy Tailwind Config**
```javascript
// Copy the config from section 8.3
```

**Step 3: Add Google Fonts**
```html
<!-- Add to index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Step 4: Start Using Patterns**
- Copy component patterns from Section 6
- Use color system from Section 1
- Apply typography from Section 2

### 10.2 Customization Guide

**To change primary color from green to another:**
```css
/* Find and replace throughout: */
green-300 → your-color-300
green-400 → your-color-400
green-500 → your-color-500
green-600 → your-color-600

/* Also update radial gradients: */
rgba(173,255,47,0.15) → rgba(your-r,your-g,your-b,0.15)
```

**To adjust shadow intensity:**
```css
/* Current: 20%, 30%, 40%, 60% */
/* Lighter: 10%, 20%, 30%, 40% */
/* Darker: 30%, 40%, 50%, 70% */
```

**To change dark theme base:**
```css
/* Replace slate-950 → zinc-950 or neutral-950 */
/* Replace slate-900 → zinc-900 or neutral-900 */
```

---

## 📄 License & Attribution

This design system was extracted from the **FlowTrack Landing Page** project.
Feel free to use this knowledgebase in your own projects.

**Key Characteristics:**
- Modern dark theme with green accents
- Financial/fintech aesthetic
- Glass morphism and depth through shadows
- Mobile-first responsive design
- Accessibility-conscious (ARIA labels, semantic HTML)

---

**Last Updated**: 2025-11-13
**Maintained by**: FlowTrack Design Team
