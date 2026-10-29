// Catches the mistakes that otherwise only show up when someone clicks:
// names that were never defined, duplicate keys, unreachable code.
const globals = require("globals");
module.exports = [
  {
    files: ["build/check-app.js", "build/check-boot.js", "src/landing/landing.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, supabase: "readonly" }
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-redeclare": "error",
      "no-func-assign": "error",
      "no-self-assign": "error",
      "use-isnan": "error",
      "valid-typeof": "error"
    }
  },
  {
    files: ["desktop/main.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "commonjs", globals: { ...globals.node } },
    rules: { "no-undef": "error", "no-unreachable": "error" }
  }
];
