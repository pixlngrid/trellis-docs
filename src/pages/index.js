import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const features = [
  {
    title: 'Theme Enhancements',
    icon: '\u2728',
    description: 'Last-updated at top, heading copy-to-clipboard, pill-style tabs, and custom admonition icons.',
    link: '/theme/',
  },
  {
    title: 'Smart Search',
    icon: '\uD83D\uDD0D',
    description: 'Build-time indexing with Fuse.js for fast, client-side fuzzy search. No external service needed.',
    link: '/plugins/smart-search/',
  },
  {
    title: 'Design Tokens',
    icon: '\uD83C\uDFA8',
    description: 'JSON-to-CSS pipeline. Define your brand in one file, regenerate all variables automatically.',
    link: '/design-tokens/',
  },
  {
    title: 'Bundled Plugins',
    icon: '\uD83D\uDD0C',
    description: 'FAQ indexer, redirects, image lightbox, and Mermaid pan/zoom — configured and ready to go.',
    link: '/plugins/',
  },
  {
    title: 'Reusable Components',
    icon: '\uD83E\uDDE9',
    description: 'Glossary, feedback widget, flipping cards, and custom search UI for your MDX pages.',
    link: '/components/',
  },
  {
    title: 'Mermaid Diagrams',
    icon: '\uD83D\uDCC8',
    description: 'Built-in Mermaid rendering with pan and zoom. Just write fenced code blocks.',
    link: '/guides/writing-docs/',
  },
];

function FeatureCard({ title, icon, description, link }) {
  return (
    <div className="col col--4" style={{ marginBottom: '1.5rem' }}>
      <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div
          style={{
            border: '1px solid var(--ifm-color-emphasis-200)',
            borderRadius: '8px',
            padding: '1.5rem',
            height: '100%',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--ifm-color-primary)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(124, 58, 237, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-200)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--ifm-color-content-secondary)', margin: 0 }}>
            {description}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className="container margin-vert--xl">
        {/* Hero */}
        <div className="row">
          <div className="col col--8 col--offset-2" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {siteConfig.title}
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--ifm-color-content-secondary)', marginBottom: '2rem' }}>
              An opinionated docs framework built on Docusaurus.
              <br />
              Structure for your content to grow on.
            </p>
            <div style={{ marginBottom: '3rem' }}>
              <Link
                className="button button--primary button--lg"
                to="/getting-started"
                style={{ marginRight: '1rem' }}
              >
                Get Started
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/overview"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="row">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
