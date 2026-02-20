import React, {useState, useRef, useEffect} from 'react';
import clsx from 'clsx';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import NavbarItem from '@theme/NavbarItem';

export default function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  onClick,
  ...props
}) {
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef(null);
  

  // Clear any pending timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('focusin', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before hiding to prevent flickering
    // when moving between dropdown trigger and menu
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  const handleToggleClick = (e) => {
    e.preventDefault();
    setShowDropdown(!showDropdown);
  };

  return (
    <div
      ref={dropdownRef}
      className={clsx('navbar__item', 'dropdown', {
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <NavbarNavLink
        aria-haspopup="true"
        aria-expanded={showDropdown}
        role="button"
        href={props.to ? undefined : '#'}
        className={clsx('navbar__link', className)}
        {...props}
        onClick={props.to ? undefined : handleToggleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}>
        {props.children ?? props.label}
      </NavbarNavLink>
      <ul className="dropdown__menu custom-dropdown__menu">
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            activeClassName="dropdown__link--active"
            className="custom-dropdown__item"
            {...childItemProps}
            key={i}
            onClick={() => {
              // Close dropdown after selecting an item
              setShowDropdown(false);
            }}
          />
        ))}
      </ul>
    </div>
  );
}