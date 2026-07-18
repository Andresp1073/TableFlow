export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  items?: NavItem[];
  isActive?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export type NavGroup = NavSection[];
