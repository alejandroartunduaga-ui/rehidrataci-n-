import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';

export default [
  // 🚫 Archivos y directorios a ignorar
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'public/**',
      'dev-dist/**',
      'coverage/**',
      'android/**',
      'ios/**',
    ],
  },

  // 📋 Configuración base recomendada
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 🛠️ Configuración específica para archivos de configuración (Node.js)
  {
    files: ['**/*.config.{js,ts}', 'eslint.config.js', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node, // Solo Node.js globals para archivos de config
      },
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off', // Permitir console.log en archivos de config
    },
  },

  // 📁 Configuración para archivos JavaScript/TypeScript/React
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node, // ✅ Agregar globals de Node.js para 'process'
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prettier/prettier': 'error', // Asegura que Prettier muestra los errores de formato como errores en ESLint
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off', // Solo si usas React 17+
      'jsx-a11y/no-noninteractive-element-interactions': 'off', // Ajustar si es necesario para accesibilidad
      'react/prop-types': 'off', // Deshabilitar la regla react/prop-types
      'jsx-a11y/iframe-has-title': 'off', // Desactivar validación de título en iframes
      'eslint-comments/disable-enable-pair': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'import/no-named-as-default-member': 'off',
      'no-empty': 'warn', // Convertir empty blocks a warning en lugar de error
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
];
