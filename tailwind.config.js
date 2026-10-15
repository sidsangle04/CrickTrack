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
  			 *   slate   -> the #F8F9FA / #E9ECEF / #212529 neutral ramp (inverted)
  			 *   emerald -> the #008C45 green ramp
  			 *   amber   -> the #FFD700 gold ramp
  			 * `white` is the ink colour here: every `text-white` was "the lightest colour"
  			 * on a dark surface, which is #212529 on a light one.
  			 */
  			white: '#212529',
  			slate: {
  				50: '#212529',
  				100: '#212529',
  				200: '#343A40',
  				300: '#495057',
  				400: '#6C757D',
  				500: '#868E96',
  				600: '#ADB5BD',
  				700: '#DEE2E6',
  				800: '#E9ECEF',
  				900: '#F8F9FA',
  				950: '#FFFFFF'
  			},
  			emerald: {
  				50: '#E8F5EE',
  				100: '#C6E7D5',
  				200: '#8FD1AC',
  				300: '#4FB57F',
  				400: '#0A7A3D',
  				500: '#008C45',
  				600: '#00713A',
  				700: '#005C2F',
  				800: '#004726',
  				900: '#00361C'
  			},
  			amber: {
  				50: '#FFF9E0',
  				100: '#FFF0B3',
  				200: '#FFE680',
  				300: '#C9A227',
  				400: '#8A6D00',
  				500: '#FFD700',
  				600: '#E6C200',
  				700: '#B38F00',
  				800: '#8A6D00',
  				900: '#6B5400'
  			},
  			/* Accent hues whose light 300/400 text shades need to darken for a light page. */
  			red: { 300: '#F87171', 400: '#DC2626' },
  			blue: { 300: '#60A5FA', 400: '#2563EB' },
  			cyan: { 300: '#22D3EE', 400: '#0891B2' },
  			rose: { 300: '#FB7185', 400: '#E11D48' },
  			purple: { 300: '#C084FC', 400: '#7C3AED' },
  			sky: { 300: '#38BDF8', 400: '#0284C7' },
  			yellow: { 300: '#FDE047', 400: '#CA8A04' },
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
