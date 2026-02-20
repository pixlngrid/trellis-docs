// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const path = require('path');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "{{projectName}}",
  tagline: "{{tagline}}",
  url: "{{siteUrl}}",
  baseUrl: "/",
  trailingSlash: true,
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.svg",
  organizationName: "",
  projectName: "{{projectSlug}}",

  customFields: {
    repoUrl: '{{repoUrl}}',
  },

  markdown: {
    mermaid: true,
  },

  themes: [
    '@docusaurus/theme-mermaid',
    '@docusaurus/theme-live-codeblock',
  ],

  staticDirectories: ['static'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          breadcrumbs: true,
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          path: 'docs',
          showLastUpdateTime: true,
          editUrl: '{{repoUrl}}/edit/main',
        },
        blog: {
          showReadingTime: false,
        },
        theme: {
          customCss: [
            './src/css/tokens.css',
            './src/css/custom.css',
          ],
        },
      }),
    ],
  ],

  plugins: [
    '@r74tech/docusaurus-plugin-panzoom',
    [
      './packages/faq-index-plugin',
      {
        faqDir: 'docs/faq',
        basePermalink: '/faq',
      },
    ],
    function webpackPlugin(context, options) {
      return {
        name: 'webpack-config-plugin',
        configureWebpack(config, isServer, utils) {
          return {
            resolve: {
              extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
              extensionAlias: {
                '.js': ['.js', '.jsx'],
                '.mjs': ['.mjs', '.mjs'],
                '.cjs': ['.cjs', '.cjs'],
              },
            },
          };
        },
      };
    },
    [
      'redirects-plugin',
      {
        redirectsFile: 'redirects.json'
      }
    ],
    [
      'smart-search-plugin',
      {
        excludedFolders: ['includes', '_includes'],
        excludedPrefixes: ['_'],
        searchWeights: {
          title: 1.0,
          'sections.heading': 1.0,
          keywords: 0.8,
          description: 0.6,
          'sections.content': 0.5,
          content: 0.4
        }
      }
    ],
    [
      'lightbox-image-plugin',
      {
        selector: '.markdown img',
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 999,
        margin: 10,
        scrollOffset: 10
      }
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: false,
        }
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      zoom: {
        selectors: ['div.mermaid[data-processed="true"]', 'div.docusaurus-mermaid-container', '.drawio'],
        wrap: true,
        timeout: 1000,
        toolbar: {
          enabled: true,
          position: 'top-right',
          opacity: 0,
        },
        enableWheelZoom: true,
        enableWheelZoomWithShift: false,
        enableDoubleClickResetZoom: true,
        restrictZoomOutBeyondOrigin: false,
      },
      metadata: [
        { property: 'og:description', content: '{{projectName}} — {{tagline}}' },
      ],
      navbar: {
        title: '{{projectName}}',
        logo: {
          alt: '{{projectName}} Logo',
          src: 'img/favicon.svg',
          className: 'header-logo',
        },
        items: [
          {
            to: '/guides/writing-docs',
            label: 'Guides',
            position: 'right',
          },
          {
            type: 'dropdown',
            label: 'Resources',
            position: 'right',
            items: [
              {
                to: '/blog',
                label: 'Release Notes',
              },
              {
                to: '/faq',
                label: 'FAQs',
              },
            ],
          },
          {
            type: 'search',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `\u00a9 ${new Date().getFullYear()} {{projectName}}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;Powered by Trellis`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
