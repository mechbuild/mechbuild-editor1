import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select } from '@mui/material';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  return (
    <Select
      value={i18n.language}
      onChange={e => i18n.changeLanguage(e.target.value)}
      size="small"
      sx={{ ml: 2 }}
    >
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="tr">Türkçe</MenuItem>
    </Select>
  );
};

export default LanguageSelector; 