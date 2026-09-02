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

export default baseConfig;
