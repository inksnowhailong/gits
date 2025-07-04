// 主流 Vue3 + TypeScript + Prettier 的 ESLint 扁平配置
import vue from 'eslint-plugin-vue'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-plugin-prettier'
import tsparser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
/**
 * @type {import("eslint").FlatConfig[]}
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/*.local',
      '**/*.log',
      '**/logs/**',
      '**/auto-import.d.ts',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
      '**/package-lock.json',
      '**/.eslintcache',
      '**/.vscode/**',
      '**/.idea/**'
    ]
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      parser: vueParser, // TypeScript 解析器
      parserOptions: {
        parser: {
          ts: tsparser
        },
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: false, tsx: false }
      }
    },
    plugins: {
      vue,
      '@typescript-eslint': typescriptEslint,
      prettier
    },
    rules: {
      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '.*' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',

      // Vue 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/require-default-prop': 'off',
      'vue/comment-directive': 'off',

      // 通用规则
      'no-console': 'off',
      'no-debugger': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // 交由 ts 处理
      'arrow-parens': 'off',
      'comma-dangle': 'off',
      'no-underscore-dangle': 'off',
      'no-undef': 'off',
      camelcase: 'off',
      quotes: 'off',
      'quote-props': 'off',
      semi: 'off',
      'max-classes-per-file': 'off',
      'linebreak-style': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'max-len': 'off',

      // Prettier 相关
      'prettier/prettier': 'warn'
    }
  },
  {
    files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
    languageOptions: {
      globals: { jest: 'readonly' }
    }
  }
]
