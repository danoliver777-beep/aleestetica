import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#135bec",
                "primary-dark": "#0e45b5",
                "secondary": "#FF9F43",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "surface-light": "#ffffff",
                "surface-dark": "#1a2230",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "Manrope", "sans-serif"],
                "sans": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "2xl": "1.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [
        forms,
        containerQueries,
    ],
}
