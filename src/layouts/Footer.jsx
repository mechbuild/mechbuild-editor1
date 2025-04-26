import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'background.paper', mt: 'auto' }}>
    <Typography variant="body2" color="text.secondary">
      © {new Date().getFullYear()} MechBuild Editor2. All rights reserved.
    </Typography>
  </Box>
);

export default Footer; 