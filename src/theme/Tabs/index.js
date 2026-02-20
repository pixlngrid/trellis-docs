// src/components/theme/Tabs/index.js
import React, { cloneElement, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  useScrollPositionBlocker,
  useTabs,
} from '@docusaurus/theme-common/internal';
import useIsBrowser from '@docusaurus/useIsBrowser';
import styles from './styles.module.css';

function TabList({
  className,
  block,
  selectedValue,
  selectValue,
  tabValues,
  queryString,
}) {
  const tabListRef = useRef(null);
  const tabRefs = [];
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  const isInitialLoad = useRef(true);

  // Handle initial tab selection from URL and scroll to make tabs visible
  useEffect(() => {
    if (window.location.search && queryString && isInitialLoad.current) {
      const params = new URLSearchParams(window.location.search);
      const parameterName =
        typeof queryString === 'string' ? queryString : 'tabs';
      const queryValue = params.get(parameterName);

      if (queryValue && queryValue !== selectedValue) {
        selectValue(queryValue);

        requestAnimationFrame(() => {
          if (tabListRef.current) {
            const headerOffset =
              document.querySelector('header')?.offsetHeight || 0;
            const tabListPosition =
              tabListRef.current.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
              top: tabListPosition - headerOffset - 20,
              behavior: 'instant',
            });
          }
        });

        isInitialLoad.current = false;
      }
    }
  }, [queryString, selectedValue, selectValue, tabValues]);

  // Handle click events on anchor links
  useEffect(() => {
    const handleClick = (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (anchor) {
        // When clicking an anchor link, remove query parameters
        const newUrl = `${window.location.pathname}${anchor.hash}`;
        window.history.pushState({}, '', newUrl);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleTabChange = (event) => {
    const newTab = event.currentTarget;
    const newTabIndex = tabRefs.indexOf(newTab);
    const newTabValue = tabValues[newTabIndex].value;

    if (newTabValue !== selectedValue) {
      blockElementScrollPositionUntilNextRender(newTab);
      selectValue(newTabValue);

      // Always update URL with the tab query parameter
      const parameterName =
        typeof queryString === 'string' ? queryString : 'tabs';
      const newUrl = `${window.location.pathname}?${parameterName}=${newTabValue}${window.location.hash}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleKeydown = (event) => {
    let focusElement = null;
    switch (event.key) {
      case 'Enter': {
        handleTabChange(event);
        break;
      }
      case 'ArrowRight': {
        const nextTab = tabRefs.indexOf(event.currentTarget) + 1;
        focusElement = tabRefs[nextTab] ?? tabRefs[0];
        break;
      }
      case 'ArrowLeft': {
        const prevTab = tabRefs.indexOf(event.currentTarget) - 1;
        focusElement = tabRefs[prevTab] ?? tabRefs[tabRefs.length - 1];
        break;
      }
      default:
        break;
    }
    focusElement?.focus();
  };

  return (
    <ul
      ref={tabListRef}
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'tabs',
        {
          'tabs--block': block,
        },
        className,
        styles.roundedTabList
      )}
    >
      {tabValues.map(({ value, label, icon: Icon, attributes }) => (
        <li
          role="tab"
          tabIndex={selectedValue === value ? 0 : -1}
          aria-selected={selectedValue === value}
          key={value}
          ref={(tabControl) => tabRefs.push(tabControl)}
          onKeyDown={handleKeydown}
          onClick={handleTabChange}
          {...attributes}
          className={clsx('tabs__item', styles.tabItem, attributes?.className, {
            'tabs__item--active': selectedValue === value,
            [styles.activeTabItem]: selectedValue === value,
          })}
        >
          {Icon && <Icon style={{ marginRight: '8px' }} />}
          {label ?? value}
        </li>
      ))}
    </ul>
  );
}

function TabContent({ lazy, children, selectedValue }) {
  const childTabs = (Array.isArray(children) ? children : [children]).filter(
    Boolean
  );
  if (lazy) {
    const selectedTabItem = childTabs.find(
      (tabItem) => tabItem.props.value === selectedValue
    );
    if (!selectedTabItem) {
      return null;
    }
    return cloneElement(selectedTabItem, { className: 'margin-top--sm' });
  }
  return (
    <div>
      {childTabs.map((tabItem, i) =>
        cloneElement(tabItem, {
          key: i,
          hidden: tabItem.props.value !== selectedValue,
        })
      )}
    </div>
  );
}

function TabsComponent(props) {
  const tabs = useTabs(props);
  return (
    <div
      className={clsx('tabs-container', styles.tabList)}
      id={props.queryString}
    >
      <TabList {...props} {...tabs} />
      <TabContent {...props} {...tabs} />
    </div>
  );
}

export default function Tabs(props) {
  const isBrowser = useIsBrowser();

  return <TabsComponent key={String(isBrowser)} {...props} />;
}