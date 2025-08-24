module.exports = {
  root: true,
  ignores: ["dist/**", "build/**"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["node:fs", "node:net", "node:child_process"], "message": "Forbidden in apps. Use wrappers." },
        { "group": ["pg", "mysql2", "knex", "typeorm"], "message": "No direct DB from apps. Use @rq/api-client." },
        { "group": ["axios", "node-fetch", "whatwg-fetch"], "message": "Use @rq/api-client only." },
        { "group": ["../../wrappers/*", "../../../wrappers/*"], "message": "Apps cannot import wrappers internals. Use @rq/* packages." }
      ]
    }]
  }
}
