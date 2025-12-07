import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'Đang tải...', 
  size = 40,
  fullScreen = false 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '400px',
        padding: 3
      }}
    >
      <CircularProgress size={size} sx={{ color: '#FF6B35' }} />
      {message && (
        <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Loading;
