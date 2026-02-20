/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'getting-started',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      collapsible: true,
      items: [
        'guides/writing-docs',
      ],
    },
  ],
};

module.exports = sidebars;
