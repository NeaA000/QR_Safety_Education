import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JavaScript 기본 설정
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    ...js.configs.recommended
  },

  // 브라우저 글로벌 변수 설정
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },

  // TypeScript 기본 설정
  ...tseslint.configs.recommended,

  // Vue 기본 설정
  ...pluginVue.configs["flat/essential"],

  // Vue 파일 파서 설정
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue']
      },
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
      }
    }
  },

  // 규칙 완화 설정
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    rules: {
      // 기본 규칙 완화
      'no-unused-vars': 'warn',
      'no-console': 'warn',

      // TypeScript 규칙 완화
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off', // any 타입 허용
      '@typescript-eslint/no-empty-object-type': 'off', // {} 타입 허용
      '@typescript-eslint/no-require-imports': 'off', // require 허용

      // Vue 규칙 완화
      'vue/multi-word-component-names': 'off' // 컴포넌트 이름 제한 완화
    }
  },

  // 설정 파일들 (Node.js 환경)
  {
    files: ['**/*.config.{js,ts}', '**/tailwind.config.*', '**/postcss.config.*', '**/vite.config.*'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // 타입 정의 파일들
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]);
