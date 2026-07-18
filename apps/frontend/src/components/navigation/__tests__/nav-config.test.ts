import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, getNavItemByHref, findActiveSection } from '../nav-config';

describe('nav-config', () => {
  it('exports NAV_ITEMS with 6 sections', () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it('has all required sections', () => {
    const titles = NAV_ITEMS.map((s) => s.title);
    expect(titles).toContain('Overview');
    expect(titles).toContain('Operations');
    expect(titles).toContain('Service');
    expect(titles).toContain('People');
    expect(titles).toContain('Finance');
    expect(titles).toContain('System');
  });

  it('each section has at least one item', () => {
    for (const section of NAV_ITEMS) {
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it('each item has label, href, and icon', () => {
    for (const section of NAV_ITEMS) {
      for (const item of section.items) {
        expect(item.label).toBeTruthy();
        expect(item.href).toBeTruthy();
        expect(item.icon).toBeTruthy();
      }
    }
  });

  it('getNavItemByHref returns correct item', () => {
    const dashboard = getNavItemByHref('/dashboard');
    expect(dashboard?.label).toBe('Dashboard');

    const settings = getNavItemByHref('/settings');
    expect(settings?.label).toBe('User Settings');
  });

  it('getNavItemByHref returns undefined for unknown href', () => {
    const result = getNavItemByHref('/unknown');
    expect(result).toBeUndefined();
  });

  it('findActiveSection returns correct section title', () => {
    expect(findActiveSection('/dashboard')).toBe('Overview');
    expect(findActiveSection('/restaurants')).toBe('Operations');
    expect(findActiveSection('/settings')).toBe('System');
  });

  it('all hrefs start with /', () => {
    for (const section of NAV_ITEMS) {
      for (const item of section.items) {
        expect(item.href.startsWith('/')).toBe(true);
      }
    }
  });
});
