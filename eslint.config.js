import { defineConfig } from '@soybeanjs/eslint-config-vue';

const baseConfig = defineConfig({
  'vue/component-name-in-template-casing': [
    'warn',
    'PascalCase',
    {
      registeredComponentsOnly: false,
      ignores: ['/^icon-/', '/^vxe-/']
    }
  ]
});

// prepend a global ignore for Tauri build artifacts (not covered by .gitignore in flat config)
export default baseConfig.then(config => [{ ignores: ['src-tauri/target/**'] }, ...config]);
