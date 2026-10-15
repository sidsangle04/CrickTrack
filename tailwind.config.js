/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)']
  		},
  		colors: {
  			/*
  			 * The app's screens were authored light-on-dark against Tailwind's `slate`
  			 * and `emerald` scales. The CrickTrack palette is light, so both scales are
  			 * re-pointed at it and the whole app follows the theme in one pass:
  			 *   slate   -> the #FFF5F5 / #FFE3E3 / #2D2A2A neutral ramp (inverted)
  			 *   emerald -> the #D32F2F red ramp
  			 * `white` is the ink colour here: every `text-white` was "the lightest colour"
  			 * on a dark surface, which is #2D2A2A on a light one.
  			 */
  			white: '#2D2A2A',
  			slate: {
  				50: '#2D2A2A',
  				100: '#2D2A2A',
  				200: '#3D3838',
  				300: '#524B4B',
  				400: '#6E6666',
  				500: '#FF9999',
  				600: '#FFBDBD',
  				700: '#FFE3E3',
  				800: '#FFFFFF',
  				900: '#FFF5F5',
  				950: '#FFFFFF'
  			},
  			emerald: {
  				50: '#FFF5F5',
  				100: '#FFE3E3',
  				200: '#FFC9C9',
  				300: '#FF9999',
  				400: '#D32F2F',
  				500: '#D32F2F',
  				600: '#B71C1C',
  				700: '#8E1414',
  				800: '#6B0F0F',
  				900: '#4A0A0A'
  			},
  			/* Accent hues whose light 300/400 text shades need to darken for a light page. */
  			red: { 300: '#F87171', 400: '#DC2626' },
  			blue: { 300: '#60A5FA', 400: '#2563EB' },
  			cyan: { 300: '#22D3EE', 400: '#0891B2' },
  			rose: { 300: '#FB7185', 400: '#E11D48' },
  			purple: { 300: '#C084FC', 400: '#7C3AED' },
  			sky: { 300: '#38BDF8', 400: '#0284C7' },
  			yellow: { 300: '#FDE047', 400: '#CA8A04' },
  			amber: { 300: '#D97706', 400: '#B45309' },
  			gold: 'hsl(var(--gold))',
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
