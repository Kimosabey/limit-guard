/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "background": "#f8fafc", // Added for compatibility
                "text-main": "#0f172a",   // Added for compatibility
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "surface-dark": "#233648",
                "text-secondary": "#92adc9",
                "dark-background": "#101922", // Added for compatibility
                "dark-text-main": "#ffffff"   // Added for compatibility
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
        },
    },
    plugins: [],
};
