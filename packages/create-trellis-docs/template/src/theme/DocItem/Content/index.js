import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import Translate from '@docusaurus/Translate';
import LastUpdated from '@theme/LastUpdated';
import IconEdit from '@theme/Icon/Edit';
import styles from './styles.module.css';

function useSyntheticTitle() {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  return shouldRender ? metadata.title : null;
}

// Component for the "Edit This Page" link
function EditThisPage({ editUrl }) {
  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={ThemeClassNames.common.editThisPage}
    >
      <IconEdit />
      <Translate
        id="theme.common.editThisPage"
        description="The link label to edit the current page"
      >
        Edit this page
      </Translate>
    </a>
  );
}

// Component for the "Suggest an Edit" link
function SuggestEdit() {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const repoUrl = siteConfig.customFields?.repoUrl || '';
  if (!repoUrl) return null;
  const issueURL = `${repoUrl}/issues/new?title=${encodeURIComponent(metadata.title)}&body=${encodeURIComponent(`Issue with: ${metadata.permalink}`)}`;
  return (
    <a
      href={issueURL}
      target="_blank"
      rel="noreferrer noopener"
      className={ThemeClassNames.common.editThisPage}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
        <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
      </svg>
      <Translate
        id="theme.common.openDocIssue"
        description="The link label to open a doc issue on the current page"
      >
        Suggest an Edit
      </Translate>
    </a>
  );
}

// Component to display the last updated date and edit links
function LastUpdatedRow({ lastUpdatedAt, formattedLastUpdatedAt, editUrl }) {
  return (
    <div className={clsx(ThemeClassNames.docs.docFooterEditMetaRow, styles.row)}>
      <div className={clsx(styles.lastUpdated)}>
        {lastUpdatedAt && (
          <LastUpdated
            lastUpdatedAt={lastUpdatedAt}
            formattedLastUpdatedAt={formattedLastUpdatedAt}
          />
        )}
      </div>
      <div className={clsx(styles.editThisPage)}>
        <SuggestEdit />
        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
        {editUrl && <EditThisPage editUrl={editUrl} />}
      </div>
    </div>
  );
}

// Main header component to display the last updated date and edit links
function DocItemHeader() {
  const { metadata } = useDoc();
  const { lastUpdatedAt, formattedLastUpdatedAt, editUrl } = metadata;
  const canDisplayLastUpdatedRow = !!lastUpdatedAt || !!editUrl;

  if (!canDisplayLastUpdatedRow) {
    return null;
  }

  return (
    <div className={clsx(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      <LastUpdatedRow
        lastUpdatedAt={lastUpdatedAt}
        formattedLastUpdatedAt={formattedLastUpdatedAt}
        editUrl={editUrl}
      />
    </div>
  );
}

export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
          <DocItemHeader />
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
