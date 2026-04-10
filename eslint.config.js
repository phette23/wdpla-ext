import globals from 'globals'
import js from "@eslint/js"

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                chrome: 'readonly',
                jQuery: 'readonly',
            },
            sourceType: 'module'
        },
        rules: {
            indent: [ 'warn', 4 ],
            'linebreak-style': [ 'error', 'unix' ],
            'no-unused-vars': 'off',
            'no-empty': 'off',
            'semi': [ 'error', 'never' ],
        }
    }
]
