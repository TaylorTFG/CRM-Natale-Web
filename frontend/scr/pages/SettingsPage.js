import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';

// Import API
import { loadSettings, saveSettings } from '../api/apiClient';

const SettingsPage = () => {
  // Stato per le impostazioni
  const [settings, setSettings] = useState({
    regaloCorrente: 'Grappa',
    annoCorrente: new Date().getFullYear(),
    consegnatari: []
  });
  
  // Stato per il dialog di aggiunta/modifica consegnatari
  const [openDialog, setOpenDialog] = useState(false);
  const [currentConsegnatario, setCurrentConsegnatario] = useState(null);
  const [consegnatarioInput, setConsegnatarioInput] = useState('');
  
  // Stato per il caricamento
  const [loading, setLoading] = useState(true);
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Carica le impostazioni all'avvio
  useEffect(() => {
    loadAppSettings();
  }, []);
  
  // Carica le impostazioni
  const loadAppSettings = async () => {
    try {
      setLoading(true);
      const result = await loadSettings();
      
      if (result.success && result.data) {
        // Inizializza con valori di default in caso di dati mancanti
        const loadedSettings = {
          regaloCorrente: result.data.regaloCorrente || 'Grappa',
          annoCorrente: result.data.annoCorrente || new Date().getFullYear(),
          consegnatari: Array.isArray(result.data.consegnatari) ? result.data.consegnatari : [
            'Andrea Gosgnach', 
            'Marco Crasnich', 
            'Massimo Cendron', 
            'Matteo Rocchetto'
          ]
        };
        
        setSettings(loadedSettings);
        console.log('Impostazioni caricate:', loadedSettings);
      } else {
        console.error('Errore nel caricamento delle impostazioni:', result.error);
        
        // Usa valori predefiniti in caso di errore
        setSettings({
          regaloCorrente: 'Grappa',
          annoCorrente: new Date().getFullYear(),
          consegnatari: [
            'Andrea Gosgnach', 
            'Marco Crasnich', 
            'Massimo Cendron', 
            'Matteo Rocchetto'
          ]
        });
        
        showSnackbar('Errore nel caricamento delle impostazioni. Usati valori predefiniti.', 'warning');
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni:', error);
      
      // Usa valori predefiniti in caso di eccezione
      setSettings({
        regaloCorrente: 'Grappa',
        annoCorrente: new Date().getFullYear(),
        consegnatari: [
          'Andrea Gosgnach', 
          'Marco Crasnich', 
          'Massimo Cendron', 
          'Matteo Rocchetto'
        ]
      });
      
      showSnackbar('Errore nel caricamento delle impostazioni. Usati valori predefiniti.', 'warning');
    } finally {
      setLoading(false);
    }
  };
  
  // Salva le impostazioni
  const saveAppSettings = async () => {
    try {
      setLoading(true);
      
      // Normalizza le impostazioni prima del salvataggio
      const settingsToSave = {
        regaloCorrente: settings.regaloCorrente || 'Regalo',
        annoCorrente: settings.annoCorrente || new Date().getFullYear(),
        consegnatari: Array.isArray(settings.consegnatari) ? 
          [...settings.consegnatari] : 
          ['Andrea Gosgnach', 'Marco Crasnich', 'Massimo Cendron', 'Matteo Rocchetto']
      };
      
      console.log('Salvataggio impostazioni:', settingsToSave);
      
      const result = await saveSettings(settingsToSave);
      
      if (result.success) {
        // Ricarica i dati per confermare che sono stati salvati correttamente
        await loadAppSettings();
        showSnackbar('Impostazioni salvate con successo', 'success');
      } else {
        console.error('Errore nel salvataggio delle impostazioni:', result.error);
        showSnackbar('Errore nel salvataggio delle impostazioni', 'error');
      }
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
      showSnackbar('Errore nel salvataggio delle impostazioni', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestione consegnatari
  const handleAddConsegnatario = () => {
    setCurrentConsegnatario(null);
    setConsegnatarioInput('');
    setOpenDialog(true);
  };
  
  const handleEditConsegnatario = (index) => {
    setCurrentConsegnatario(index);
    setConsegnatarioInput(settings.consegnatari[index]);
    setOpenDialog(true);
  };
  
  const handleDeleteConsegnatario = (index) => {
    if (window.confirm('Sei sicuro di voler eliminare questo consegnatario?')) {
      const updatedConsegnatari = [...settings.consegnatari];
      updatedConsegnatari.splice(index, 1);
      
      setSettings(prev => ({
        ...prev,
        consegnatari: updatedConsegnatari
      }));
    }
  };
  
  const handleSaveConsegnatario = () => {
    if (!consegnatarioInput.trim()) {
      showSnackbar('Il nome del consegnatario non può essere vuoto', 'error');
      return;
    }
    
    const updatedConsegnatari = Array.isArray(settings.consegnatari) ? [...settings.consegnatari] : [];
    
    if (currentConsegnatario !== null) {
      // Modifica
      updatedConsegnatari[currentConsegnatario] = consegnatarioInput.trim();
    } else {
      // Aggiunta
      updatedConsegnatari.push(consegnatarioInput.trim());
    }
    
    setSettings(prev => ({
      ...prev,
      consegnatari: updatedConsegnatari
    }));
    
    setOpenDialog(false);
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
  
  // Funzione per ripristinare i consegnatari predefiniti
  const resetConsegnatari = () => {
    if (window.confirm('Sei sicuro di voler ripristinare i consegnatari predefiniti?')) {
      setSettings(prev => ({
        ...prev,
        consegnatari: [
          'Andrea Gosgnach', 
          'Marco Crasnich', 
          'Massimo Cendron', 
          'Matteo Rocchetto'
        ]
      }));
      
      showSnackbar('Consegnatari ripristinati', 'success');
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Impostazioni</Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveAppSettings}
          disabled={loading}
        >
          Salva Impostazioni
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Impostazioni Generali */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Impostazioni Generali</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Regalo Corrente"
                name="regaloCorrente"
                value={settings.regaloCorrente || ''}
                onChange={handleInputChange}
                fullWidth
                required
                variant="outlined"
                helperText="Nome del regalo per l'anno corrente (es. Grappa, Vino, Cesto natalizio)"
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Questo nome verrà utilizzato in tutto il CRM al posto di 'Grappa'">
                      <InfoIcon color="action" sx={{ ml: 1, opacity: 0.6 }} />
                    </Tooltip>
                  )
                }}
              />
              
              <TextField
                label="Anno Corrente"
                name="annoCorrente"
                value={settings.annoCorrente || new Date().getFullYear()}
                onChange={handleInputChange}
                type="number"
                fullWidth
                helperText="Anno corrente per la gestione dei regali"
              />
            </Box>
          </Paper>
          
          {/* Gestione Consegnatari */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Gestione Consegnatari</Typography>
              
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddConsegnatario}
                  sx={{ mr: 1 }}
                >
                  Aggiungi
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={resetConsegnatari}
                >
                  Ripristina Default
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {Array.isArray(settings.consegnatari) && settings.consegnatari.length > 0 ? (
              <List>
                {settings.consegnatari.map((consegnatario, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton 
                            edge="end" 
                            aria-label="edit"
                            onClick={() => handleEditConsegnatario(index)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDeleteConsegnatario(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={consegnatario}
                        secondary={`Consegnatario #${index + 1}`}
                      />
                    </ListItem>
                    {index < settings.consegnatari.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                Nessun consegnatario configurato
              </Typography>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Dialog per aggiunta/modifica consegnatari */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {currentConsegnatario !== null ? 'Modifica Consegnatario' : 'Nuovo Consegnatario'}
        </DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome e Cognome"
            fullWidth
            value={consegnatarioInput}
            onChange={(e) => setConsegnatarioInput(e.target.value)}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveConsegnatario} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
      
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

export default SettingsPage;