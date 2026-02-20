{
  "name": "{{projectSlug}}",
  "license": "MIT",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build-tokens": "node scripts/build-tokens.js",
    "docusaurus": "npm run build-tokens && docusaurus",
    "start": "npm run build-tokens && docusaurus start --port 3001",
    "build": "npm run build-tokens && docusaurus build",
    "serve": "docusaurus serve",
    "clear": "docusaurus clear"
  },
  "dependencies": {
    "@ant-design/icons": "^5.3.7",
    "@docusaurus/core": "^3.9.2",
    "@docusaurus/mdx-loader": "^3.9.2",
    "@docusaurus/preset-classic": "^3.9.2",
    "@docusaurus/theme-live-codeblock": "^3.9.2",
    "@docusaurus/theme-mermaid": "3.9.2",
    "@emotion/react": "^11.13.3",
    "@emotion/styled": "^11.13.0",
    "@mdx-js/react": "^3.1.1",
    "@mermaid-js/layout-elk": "^0.1.9",
    "@mui/icons-material": "^5.10.6",
    "@mui/material": "^5.16.4",
    "@r74tech/docusaurus-plugin-panzoom": "^2.4.0",
    "antd": "^5.27.3",
    "clsx": "^2.0.0",
    "fuse.js": "^7.1.0",
    "gray-matter": "^4.0.3",
    "lightbox-image-plugin": "^1.0.1",
    "mermaid": "^11.11.0",
    "prism-react-renderer": "^2.4.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^5.3.4",
    "redirects-plugin": "file:./packages/redirects-plugin",
    "docusaurus-plugin-faq-index": "file:./packages/faq-index-plugin",
    "smart-search-plugin": "^3.1.1",
    "webpack": "^5.104.1",
    "yaml": "^2.8.1"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "3.9.2",
    "@docusaurus/types": "3.9.2"
  },
  "browserslist": {
    "production": [
      ">0.5%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 3 chrome version",
      "last 3 firefox version",
      "last 5 safari version"
    ]
  }
}
