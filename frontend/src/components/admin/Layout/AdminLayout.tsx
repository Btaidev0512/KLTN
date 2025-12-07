import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import SideNav from './SideNav';
import TopNav from './TopNav';

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Top Navigation */}
      <TopNav onMenuClick={handleDrawerToggle} />

      {/* Side Navigation - Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <SideNav variant="permanent" />
      </Box>

      {/* Side Navigation - Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <SideNav 
          variant="temporary" 
          open={mobileOpen} 
          onClose={handleDrawerToggle}
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
