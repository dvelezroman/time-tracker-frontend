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
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: ('ADMIN' | 'OPERATOR')[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
  },
  {
    label: 'Events',
    icon: <EventIcon />,
    path: ROUTES.EVENTS,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Categories',
    icon: <CategoryIcon />,
    path: ROUTES.CATEGORIES,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Users',
    icon: <PeopleIcon />,
    path: ROUTES.USERS,
    roles: ['ADMIN'],
  },
  {
    label: 'Settings',
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
          Menu
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
              <ListItemText primary={item.label} />
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
