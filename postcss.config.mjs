// Tailwind v4 through PostCSS (see [[css-postcss-tailwind]] — Tailwind on top,
// PostCSS as the processing layer underneath). Autoprefixer stays in the chain
// so the door is open for further PostCSS plugins without a parallel toolchain.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
