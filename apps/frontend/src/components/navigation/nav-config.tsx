import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Sofa,
  Table2,
  ShoppingCart,
  ChefHat,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  ArrowUpDown,
  ClipboardList,
  AlertTriangle,
  Gift,
  Award,
  Star,
  Wallet,
  TrendingUp,
  DollarSign,
  Shield,
  Download,
} from 'lucide-react';
import type { NavGroup, NavItem } from './nav-types';

export const NAV_ITEMS: NavGroup = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Restaurants',
        href: '/restaurants',
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        label: 'Reservations',
        href: '/reservations',
        icon: <CalendarCheck className="h-4 w-4" />,
      },
      {
        label: 'Dining Areas',
        href: '/dining-areas',
        icon: <Sofa className="h-4 w-4" />,
      },
      {
        label: 'Tables',
        href: '/tables',
        icon: <Table2 className="h-4 w-4" />,
      },
    ],
  },
  {
    title: 'Service',
    items: [
      {
        label: 'Point of Sale',
        href: '/pos',
        icon: <Wallet className="h-4 w-4" />,
      },
      {
        label: 'Orders',
        href: '/orders',
        icon: <ShoppingCart className="h-4 w-4" />,
        items: [
          { label: 'All Orders', href: '/orders', icon: <ShoppingCart className="h-4 w-4" /> },
          { label: 'New Order', href: '/orders/new', icon: <ShoppingCart className="h-4 w-4" /> },
        ],
      },
      {
        label: 'Kitchen',
        href: '/kitchen',
        icon: <ChefHat className="h-4 w-4" />,
      },
      {
        label: 'Inventory',
        href: '/inventory',
        icon: <Package className="h-4 w-4" />,
        items: [
          { label: 'Dashboard', href: '/inventory', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Products', href: '/inventory/products', icon: <Package className="h-4 w-4" /> },
          { label: 'Categories', href: '/inventory/categories', icon: <Package className="h-4 w-4" /> },
          { label: 'Suppliers', href: '/inventory/suppliers', icon: <Building2 className="h-4 w-4" /> },
          { label: 'Stock', href: '/inventory/stock', icon: <Package className="h-4 w-4" /> },
          { label: 'Movements', href: '/inventory/stock-movements', icon: <ArrowUpDown className="h-4 w-4" /> },
          { label: 'Purchase Orders', href: '/inventory/purchase-orders', icon: <ClipboardList className="h-4 w-4" /> },
          { label: 'Receiving', href: '/inventory/receiving', icon: <Package className="h-4 w-4" /> },
          { label: 'Alerts', href: '/inventory/alerts', icon: <AlertTriangle className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: 'People',
    items: [
      {
        label: 'Customers',
        href: '/customers',
        icon: <Users className="h-4 w-4" />,
        items: [
          { label: 'Dashboard', href: '/customers', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'All Customers', href: '/customers/list', icon: <Users className="h-4 w-4" /> },
          { label: 'Loyalty', href: '/loyalty', icon: <Award className="h-4 w-4" /> },
          { label: 'Reward History', href: '/loyalty/reward-history', icon: <Gift className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Payments',
        href: '/payments',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: <BarChart3 className="h-4 w-4" />,
        items: [
          { label: 'Executive Dashboard', href: '/analytics', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Sales', href: '/analytics/sales', icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'Reservations', href: '/analytics/reservations', icon: <CalendarCheck className="h-4 w-4" /> },
          { label: 'Occupancy', href: '/analytics/occupancy', icon: <Table2 className="h-4 w-4" /> },
          { label: 'Inventory', href: '/analytics/inventory', icon: <Package className="h-4 w-4" /> },
          { label: 'Kitchen', href: '/analytics/kitchen', icon: <ChefHat className="h-4 w-4" /> },
          { label: 'Customers', href: '/analytics/customers', icon: <Users className="h-4 w-4" /> },
          { label: 'Financial', href: '/analytics/financial', icon: <DollarSign className="h-4 w-4" /> },
          { label: 'Audit', href: '/analytics/audit', icon: <Shield className="h-4 w-4" /> },
          { label: 'Export Center', href: '/analytics/export', icon: <Download className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

export function getNavItemByHref(href: string, items: NavGroup = NAV_ITEMS): NavItem | undefined {
  for (const section of items) {
    for (const item of section.items) {
      if (item.href === href) return item;
      if (item.items) {
        const found = getNavItemByHref(href, [{ items: item.items }]);
        if (found) return found;
      }
    }
  }
  return undefined;
}

export function findActiveSection(pathname: string, items: NavGroup = NAV_ITEMS): string | undefined {
  for (const section of items) {
    for (const item of section.items) {
      if (pathname.startsWith(item.href) && item.href !== '/') return section.title;
      if (item.items) {
        const found = findActiveSection(pathname, [{ items: item.items }]);
        if (found) return section.title;
      }
    }
  }
  return undefined;
}
