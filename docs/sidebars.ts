import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'getting-started/installation' },
      items: [
        'getting-started/your-first-mfe',
        'getting-started/composing-mfes',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: { type: 'doc', id: 'architecture/overview' },
      items: [
        'architecture/fe-specifier',
        'architecture/mfe-interface',
        'architecture/externalization',
        'architecture/import-maps',
        'architecture/runtime-model',
        'architecture/platform-config',
        'architecture/jit-compilation',
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      items: [
        'packages/core',
        'packages/runtime',
        'packages/compiler',
        'packages/cli',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/dev-workflow',
        'guides/publishing',
        'guides/linking-dependencies',
        'guides/cli-plugins',
        'guides/cross-ecosystem',
        'guides/devtools',
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/react-mfe',
        'tutorials/solid-mfe',
        'tutorials/host-app',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/version-conflicts',
        'advanced/browser-support',
        'advanced/ci-integration',
      ],
    },
    'contributing',
  ],
};

export default sidebars;
