import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--8 col--offset-2" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {siteConfig.title}
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--ifm-color-content-secondary)', marginBottom: '2rem' }}>
              {{tagline}}
            </p>
            <div>
              <Link
                className="button button--primary button--lg"
                to="/getting-started"
                style={{ marginRight: '1rem' }}
              >
                Get Started
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/guides/writing-docs"
              >
                Read the Guides
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
