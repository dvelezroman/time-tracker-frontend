'use client';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import EventIcon from '@mui/icons-material/Event';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  labelKey: string;
  icon: React.ReactNode;
  path: string;
  roles?: ('ADMIN' | 'OPERATOR')[];
}

const navItems: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
  },
  {
    labelKey: 'nav.events',
    icon: <EventIcon />,
    path: ROUTES.EVENTS,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    labelKey: 'nav.categories',
    icon: <CategoryIcon />,
    path: ROUTES.CATEGORIES,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    labelKey: 'nav.competitors',
    icon: <EmojiEventsIcon />,
    path: ROUTES.COMPETITORS,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    labelKey: 'nav.users',
    icon: <PeopleIcon />,
    path: ROUTES.USERS,
    roles: ['ADMIN'],
  },
  {
    labelKey: 'nav.notifications',
    icon: <NotificationsIcon />,
    path: ROUTES.NOTIFICATIONS,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    labelKey: 'nav.settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      onClose();
    }
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          {t('common.menu') || 'Menu'}
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={pathname === item.path || pathname?.startsWith(item.path + '/')}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.labelKey as any)} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
