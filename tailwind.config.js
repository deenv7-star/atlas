
// ── ATLAS brand palette (docs/brand.md). Legacy palette names are re-pointed so every
// existing page lands on one color system: purple/violet/indigo/blue/teal/cyan → brand indigo,
// gray/slate/zinc/neutral/stone → navy-tinted neutrals, green/emerald → success,
// red/rose/pink → danger, amber/yellow/orange → amber accent.
const brand = { 50: '#F1EFFE', 100: '#E4E1FD', 200: '#C9C3FB', 300: '#A79EF8', 400: '#7F72F4', 500: '#5545F0', 600: '#3E2BF1', 700: '#2A1AC9', 800: '#22169E', 900: '#1B2656', 950: '#121A3D', DEFAULT: '#3E2BF1' };
const neutral = { 50: '#F7F8FB', 100: '#F1F3F8', 200: '#E7E9F1', 300: '#D7DBE8', 400: '#646B85', 500: '#5A6282', 600: '#4A5578', 700: '#3A4469', 800: '#28325F', 900: '#1B2656', 950: '#121A3D' };
const success = { 50: '#E7F7F0', 100: '#CFF0E2', 200: '#A6E3CA', 300: '#74D1AC', 400: '#45BF8F', 500: '#22B07D', 600: '#137050', 700: '#157554', 800: '#115C43', 900: '#0D4634', 950: '#072A1F' };
const danger = { 50: '#FDEEEE', 100: '#FBDADA', 200: '#F8BDBD', 300: '#F49393', 400: '#F17575', 500: '#EF5B5B', 600: '#C93C3C', 700: '#B53636', 800: '#8E2B2B', 900: '#6E2222', 950: '#401313' };
// v5 (direction-v5.md): amber is only ever a tiny "needs attention" dot. Legacy amber/yellow/orange/warning
// classes therefore land on cool neutrals; only the 400/500 steps (dots, small marks) keep the amber hue.
const amber = { 50: '#F3F4F8', 100: '#ECEEF4', 200: '#DDE1EB', 300: '#C5CAD9', 400: '#F8B040', 500: '#F8B040', 600: '#4A5578', 700: '#3A4469', 800: '#28325F', 900: '#1B2656', 950: '#121A3D' };

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: { sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
  		fontSize: { meta: ['13px', '18px'], body: ['15px', '22px'], lead: ['18px', '26px'], h3: ['22px', '28px'], h2: ['28px', '32px'] },
  		boxShadow: { card: 'var(--shadow-card)', raised: 'var(--shadow-raised)', sheet: 'var(--shadow-sheet)' },
  		transitionTimingFunction: { out: 'cubic-bezier(0.2, 0.8, 0.2, 1)', spring: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			brand, navy: { 900: '#1B2656', DEFAULT: '#1B2656' }, ink: { 600: '#4A5578', 400: '#646B85', 300: '#9CA3B4' }, attention: '#F8B040',
  			canvas: '#F7F8FB', surface: '#FFFFFF', line: '#E6E8F0',
  			channel: { booking: '#1B2656', airbnb: '#EF5B5B', direct: '#3E2BF1', other: '#8C93AB' },
  			success, danger, warning: amber,
  			purple: brand, violet: brand, indigo: brand, blue: brand, sky: brand, teal: brand, cyan: brand, fuchsia: brand,
  			gray: neutral, slate: neutral, zinc: neutral, neutral, stone: neutral,
  			green: success, emerald: success, lime: success,
  			red: danger, rose: danger, pink: danger,
  			amber, yellow: amber, orange: amber,
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}