/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'getting-started',
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      collapsible: true,
      items: [
        'overview/index',
        'overview/trellis-vs-docusaurus',
        'overview/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Theme',
      collapsed: true,
      collapsible: true,
      items: [
        'theme/index',
        'theme/last-updated',
        'theme/heading-anchors',
        'theme/tabs',
        'theme/admonitions',
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      collapsed: true,
      collapsible: true,
      items: [
        'plugins/index',
        'plugins/smart-search',
        'plugins/faq-index',
        'plugins/redirects',
      ],
    },
    {
      type: 'category',
      label: 'Design Tokens',
      collapsed: true,
      collapsible: true,
      items: [
        'design-tokens/index',
        'design-tokens/customizing',
      ],
    },
    {
      type: 'category',
      label: 'Components',
      collapsed: true,
      collapsible: true,
      items: [
        'components/index',
        'components/glossary',
        'components/feedback',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      collapsible: true,
      items: [
        'guides/writing-docs',
        'guides/using-components',
      ],
    },
  ],
};

module.exports = sidebars;
