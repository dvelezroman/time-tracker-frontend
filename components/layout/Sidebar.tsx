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
  IconButton,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import EventIcon from '@mui/icons-material/Event';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
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

export function Sidebar({ open, onClose, collapsed = false, onCollapseToggle }: SidebarProps) {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap component="div">
            {t('common.menu') || 'Menu'}
          </Typography>
        )}
        {!isMobile && onCollapseToggle && (
          <Tooltip title={collapsed ? t('common.expand') || 'Expand' : t('common.collapse') || 'Collapse'}>
            <IconButton onClick={onCollapseToggle} size="small">
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {filteredNavItems.map((item) => {
          const isSelected = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Tooltip
              key={item.path}
              title={collapsed ? (t(item.labelKey as Parameters<typeof t>[0]) || '') : ''}
              placement="right"
              disableHoverListener={!collapsed}
            >
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: { xs: 52, sm: 48 },
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : { xs: 2, sm: 2 },
                    py: { xs: 1.5, sm: 1 },
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                      color: isSelected ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={t(item.labelKey as Parameters<typeof t>[0])} />}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  const currentWidth = collapsed && !isMobile ? collapsedDrawerWidth : drawerWidth;

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
