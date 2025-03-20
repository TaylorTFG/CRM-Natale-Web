import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

// Import API
import { loadData, restoreFromEliminati, deleteFromEliminati, emptyTrash } from '../api/apiClient';

const EliminatiPage = () => {
  // Stato per i dati degli eliminati
  const [eliminati, setEliminati] = useState([]);
  const [filteredEliminati, setFilteredEliminati] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca e i filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [annoFilter, setAnnoFilter] = useState('');
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Stato per il dialogo di eliminazione totale
  const [openDeleteAllDialog, setOpenDeleteAllDialog] = useState(false);
  
  // Opzioni per il filtro anno
  const [anniDisponibili, setAnniDisponibili] = useState([]);
  
  // Carica i dati all'avvio
  useEffect(() => {
    loadEliminati();
  }, []);
  
  // Filtra gli eliminati quando cambiano i filtri
  useEffect(() => {
    applyFilters();
  }, [searchTerm, tipoFilter, annoFilter, eliminati]);
  
  // Carica gli eliminati
  const loadEliminati = async () => {
    try {
      setLoading(true);
      const result = await loadData('eliminati');
      
      if (result.success) {
        // Ordina gli eliminati per data di eliminazione (i più recenti prima)
        const sortedData = result.data.sort((a, b) => 
          (b.eliminatoIl || 0) - (a.eliminatoIl || 0)
        );
        
        setEliminati(sortedData);
        
        // Estrai gli anni disponibili
        const anni = [...new Set(sortedData.map(item => {
          if (item.eliminatoIl) {
            return new Date(item.eliminatoIl).getFullYear();
          }
          return new Date().getFullYear();
        }))].sort((a, b) => b - a); // Ordina in modo decrescente
        
        setAnniDisponibili(anni);
        
        console.log(`Caricati ${result.data.length} eliminati`);
      } else {
        console.error('Errore nel caricamento degli eliminati:', result.error);
        showSnackbar('Errore nel caricamento degli eliminati', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento degli eliminati:', error);
      showSnackbar('Errore nel caricamento degli eliminati', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Applica i filtri
  const applyFilters = () => {
    let filtered = [...eliminati];
    
    // Applica filtro ricerca
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          (item.nome && item.nome.toLowerCase().includes(lowercasedFilter)) ||
          (item.azienda && item.azienda.toLowerCase().includes(lowercasedFilter)) ||
          (item.localita && item.localita.toLowerCase().includes(lowercasedFilter))
        );
      });
    }
    
    // Applica filtro tipo
    if (tipoFilter !== '') {
      filtered = filtered.filter(item => item.tipo === tipoFilter);
    }
    
    // Applica filtro anno
    if (annoFilter !== '') {
      const annoInt = parseInt(annoFilter, 10);
      filtered = filtered.filter(item => {
        if (item.eliminatoIl) {
          return new Date(item.eliminatoIl).getFullYear() === annoInt;
        }
        return false;
      });
    }
    
    setFilteredEliminati(filtered);
    setPage(0);
  };
  
  // Ripristina un elemento eliminato
  const handleRestore = async (id) => {
    try {
      setLoading(true);
      const result = await restoreFromEliminati(id);
      
      if (result.success) {
        // Rimuovi l'elemento dagli eliminati
        setEliminati(prev => prev.filter(item => item.id !== id));
        showSnackbar('Elemento ripristinato con successo', 'success');
      } else {
        console.error('Errore durante il ripristino:', result.error);
        showSnackbar('Errore durante il ripristino', 'error');
      }
    } catch (error) {
      console.error('Errore durante il ripristino:', error);
      showSnackbar('Errore durante il ripristino', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina definitivamente un elemento
  const handleDeletePermanently = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare definitivamente questo elemento? Questa azione non può essere annullata.')) {
      try {
        setLoading(true);
        
        const result = await deleteFromEliminati(id);
        
        if (result.success) {
          // Rimuovi l'elemento dalla lista degli eliminati
          setEliminati(prev => prev.filter(item => item.id !== id));
          showSnackbar('Elemento eliminato definitivamente', 'success');
        } else {
          console.error('Errore durante l\'eliminazione definitiva:', result.error);
          showSnackbar('Errore durante l\'eliminazione definitiva', 'error');
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione definitiva:', error);
        showSnackbar('Errore durante l\'eliminazione definitiva', 'error');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Svuota completamente gli eliminati
  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      
      const result = await emptyTrash();
      
      if (result.success) {
        setEliminati([]);
        setFilteredEliminati([]);
        showSnackbar('Cestino svuotato con successo', 'success');
        setOpenDeleteAllDialog(false);
      } else {
        console.error('Errore durante lo svuotamento del cestino:', result.error);
        showSnackbar('Errore durante lo svuotamento del cestino', 'error');
      }
    } catch (error) {
      console.error('Errore durante lo svuotamento del cestino:', error);
      showSnackbar('Errore durante lo svuotamento del cestino', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione paginazione
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Formatta la data
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Data sconosciuta';
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setTipoFilter('');
    setAnnoFilter('');
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Elementi Eliminati</Typography>
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteSweepIcon />}
          onClick={() => setOpenDeleteAllDialog(true)}
          disabled={eliminati.length === 0}
        >
          Svuota Cestino
        </Button>
      </Box>
      
      {/* Filtri e Ricerca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, 
          gap: 2,
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Cerca per nome, azienda o località..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={tipoFilter}
              label="Tipo"
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="clienti">Clienti</MenuItem>
              <MenuItem value="partner">Partner</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Anno</InputLabel>
            <Select
              value={annoFilter}
              label="Anno"
              onChange={(e) => setAnnoFilter(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              {anniDisponibili.map(anno => (
                <MenuItem key={anno} value={anno.toString()}>{anno}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={resetFilters}
          >
            Reset Filtri
          </Button>
        </Box>
      </Paper>
      
      {/* Statistiche */}
      {eliminati.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>
              Totale elementi nel cestino: <strong>{eliminati.length}</strong>
            </Typography>
            
            <Typography>
              Elementi visualizzati: <strong>{filteredEliminati.length}</strong>
            </Typography>
            
            {tipoFilter && (
              <Typography>
                {tipoFilter === 'clienti' ? 'Clienti' : 'Partner'}: <strong>
                  {eliminati.filter(item => item.tipo === tipoFilter).length}
                </strong>
              </Typography>
            )}
          </Box>
        </Paper>
      )}
      
      {/* Tabella Eliminati */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Azienda</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Località</TableCell>
                    <TableCell>Data Eliminazione</TableCell>
                    <TableCell align="center">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {filteredEliminati.length > 0 ? (
                    filteredEliminati
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nome || ''}</TableCell>
                          <TableCell>{item.azienda || ''}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.tipo === 'clienti' ? 'Cliente' : 'Partner'}
                              color={item.tipo === 'clienti' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{item.localita || ''}</TableCell>
                          <TableCell>{formatDate(item.eliminatoIl)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ripristina">
                              <IconButton
                                color="primary"
                                onClick={() => handleRestore(item.id)}
                              >
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Elimina definitivamente">
                              <IconButton
                                color="error"
                                onClick={() => handleDeletePermanently(item.id)}
                              >
                                <DeleteForeverIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {loading ? 'Caricamento...' : 'Nessun elemento eliminato trovato'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredEliminati.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
            />
          </>
        )}
      </Paper>
      
      {/* Dialog per conferma eliminazione totale */}
      <Dialog open={openDeleteAllDialog} onClose={() => setOpenDeleteAllDialog(false)}>
        <DialogTitle>
          Svuota Cestino
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Sei sicuro di voler eliminare <strong>definitivamente</strong> tutti gli elementi nel cestino?
          </Typography>
          
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Questa operazione non può essere annullata e tutti i {eliminati.length} elementi verranno persi permanentemente.
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenDeleteAllDialog(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteAll}
            disabled={loading}
          >
            Elimina Tutto
          </Button>
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

export default EliminatiPage;