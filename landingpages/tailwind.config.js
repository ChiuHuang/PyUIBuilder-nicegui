/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'tw-',
	important: false,
	content: [
		"landingpages/landingpage/**/*.{html, jsx, js}",
		"landingpages/landingpage/**/*.js",
		"landingpages/landingpage/**/*.html",
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#fff',
				secondary: "#000",
			}
		},
	},
	plugins: [],
}

