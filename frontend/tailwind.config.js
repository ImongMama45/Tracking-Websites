export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#f4f7fb",
        brand: "#2563eb",
        teal: "#14b8a6",
        violet: "#7c3aed"
      },
      boxShadow: {
        panel: "0 18px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
