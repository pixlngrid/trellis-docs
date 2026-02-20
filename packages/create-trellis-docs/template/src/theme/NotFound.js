import React from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import { PageMetadata } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';

export default function NotFound() {
  return (
    <>
      <PageMetadata
        title={translate({
          id: 'theme.NotFound.title',
          message: 'Page Not Found',
        })}
      />
      <Layout className="conver-404">
        <main className="container margin-vert--xl">
          <div className="row">
            <div className="col col--6 col--offset-3">
              <h1 className="hero__title not-found">
                <Translate
                  id="theme.NotFound.title"
                  description="The title of the 404 page"
                >
                  Page Not Found
                </Translate>
              </h1>
              <p className="not-found">
                <Translate
                  id="theme.NotFound.p1"
                  description="The first paragraph of the 404 page"
                >
                  The link you clicked may be broken or the page may have been
                  removed.
                </Translate>
              </p>
              <div className="intro-text-button">
                <div>
                  <a className="button button--primary button-404" href="/">
                    Go Home!
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}
