import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { loadData } from '../api/apiClient';

const PartnerPage = () => {
  const [partner, setPartner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    loadPartner();
  }, []);

  // Carica i partner dal backend
  const loadPartner = async () => {
    try {
      setLoading(true);
      const result = await loadData('partner');
      
      if (result.success) {
        setPartner(result.data);
        console.log(`Caricati ${result.data.length} partner`);
      } else {
        console.error('Errore nel caricamento dei partner:', result.error);
        showSnackbar('Errore nel caricamento dei partner', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei partner:', error);
      showSnackbar('Errore nel caricamento dei partner', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mostra notifica
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Chiudi notifica
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestione Partner
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Da questa pagina è possibile gestire l'elenco dei partner, importare dati da Excel, e gestire l'assegnazione di regali e spedizioni.
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={loadPartner}
          disabled={loading}
          color="secondary"
        >
          Ricarica Partner
        </Button>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Partner Caricati: {partner.length}
          </Typography>
          
          {partner.length > 0 ? (
            <Typography variant="body2">
              L'implementazione completa della tabella e delle funzionalità di gestione sarà disponibile nelle prossime versioni.
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nessun partner trovato. Utilizza il pulsante "Importa Excel" per caricare i dati.
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PartnerPage;