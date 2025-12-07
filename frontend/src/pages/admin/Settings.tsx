import React, { useState } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Gear,
  CreditCard,
  Truck,
  Receipt,
  Bell,
} from '@phosphor-icons/react';
import { GeneralSettings } from '../../components/admin/Settings/GeneralSettings';
import { PaymentSettings } from '../../components/admin/Settings/PaymentSettings';
import { ShippingSettings } from '../../components/admin/Settings/ShippingSettings';
import { TaxSettings } from '../../components/admin/Settings/TaxSettings';
import { AdvancedSettings } from '../../components/admin/Settings/AdvancedSettings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Cài đặt hệ thống
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<Gear size={20} />}
            iconPosition="start"
            label="Cài đặt chung"
          />
          <Tab
            icon={<CreditCard size={20} />}
            iconPosition="start"
            label="Thanh toán"
          />
          <Tab
            icon={<Truck size={20} />}
            iconPosition="start"
            label="Vận chuyển"
          />
          <Tab
            icon={<Receipt size={20} />}
            iconPosition="start"
            label="Thuế & Hóa đơn"
          />
          <Tab
            icon={<Bell size={20} />}
            iconPosition="start"
            label="Nâng cao"
          />
        </Tabs>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TabPanel value={currentTab} index={0}>
          <GeneralSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <PaymentSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <ShippingSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <TaxSettings />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <AdvancedSettings />
        </TabPanel>
      </Box>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Box>
  );
};

export default Settings;
