import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Toolbar,
  Box,
  Typography 
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

// Larghezza della sidebar
const drawerWidth = 240;

const Sidebar = ({ open }) => {
  const location = useLocation();
  
  // Items della sidebar
  const menuItems = [
    {
      text: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />
    },
    {
      text: 'Clienti',
      path: '/clienti',
      icon: <PeopleIcon />
    },
    {
      text: 'Partner',
      path: '/partner',
      icon: <BusinessIcon />
    },
    {
      text: 'Spedizioni GLS',
      path: '/spedizioni',
      icon: <LocalShippingIcon />
    },
    {
      text: 'Impostazioni',
      path: '/settings',
      icon: <SettingsIcon />
    },
    {
      text: 'Eliminati',
      path: '/eliminati',
      icon: <DeleteIcon />
    }
  ];

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar /> {/* Spazio per l'header */}
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CardGiftcardIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight="bold">
            CRM Natale
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Gestione Regali Natale
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box sx={{ p: 2, opacity: 0.7 }}>
        <Typography variant="caption" display="block" gutterBottom>
          © {new Date().getFullYear()}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;