import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [language, setLanguage] = React.useState(i18n.language);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="language-select-label">{t('language')}</InputLabel>
        <Select
          labelId="language-select-label"
          value={language}
          label={t('language')}
          onChange={handleLanguageChange}
          size="small"
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="tr">Türkçe</MenuItem>
          <MenuItem value="ru">Русский</MenuItem>
          <MenuItem value="ar">العربية</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector; 