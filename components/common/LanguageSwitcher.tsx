'use client';

import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useState } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLocale: 'en' | 'es') => {
    setLocale(newLocale);
    handleClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} aria-label="change language">
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => handleLanguageChange('en')}
          selected={locale === 'en'}
        >
          <ListItemText>English</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleLanguageChange('es')}
          selected={locale === 'es'}
        >
          <ListItemText>Español</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}



