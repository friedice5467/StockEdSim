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
            height: {
                '3/40': '7.5%',
                '37/40': '92.5%',
            }
        },
    },
    darkMode: "class",
    plugins: [require("tw-elements-react/dist/plugin.cjs")]
}