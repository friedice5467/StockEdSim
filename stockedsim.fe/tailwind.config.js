/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "/src/components/*.js",
        "/src/components/**/*.js",
        "/src/components/**/**/*.js",
        "./node_modules/tw-elements-react/dist/js/**/*.js"
    ],
    theme: {
        extend: {
            maxHeight: {
                '3/40': '7.5%',
                '37/40': '92.5%',
                '1/20': '5%',
                
            },
            height: {
                '37/40': '92.5%',
                '19/20': '95%',
            }
        },
    },
    darkMode: "class",
    plugins: [require("tw-elements-react/dist/plugin.cjs")]
}