// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-var-requires': 0,
            '@typescript-eslint/no-misused-promises': [
                2,
                {
                    checksVoidReturn: {
                        attributes: false,
                    },
                },
            ],
        }
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'no-unused-vars': 'off', // replaced with @typescript-eslint/no-unused-vars
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn about unused variables, but ignore those prefixed with _
        }
    }
);