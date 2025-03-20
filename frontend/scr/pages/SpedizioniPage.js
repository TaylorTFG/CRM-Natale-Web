import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';

// Import API
import { loadData, updateBulk, exportGLS } from '../api/apiClient';

const SpedizioniPage = () => {
  // Stato per i dati
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca e i filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocalita, setFiltroLocalita] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroGLS, setFiltroGLS] = useState('');
  
  // Stato per l'ordinamento
  const [orderBy, setOrderBy] = useState('nome');
  const [orderDirection, setOrderDirection] = useState('asc');
  
  // Lista delle località e province per i filtri
  const [localitaList, setLocalitaList] = useState([]);
  const [provinciaList, setProvinciaList] = useState([]);
  
  // Stato per la selezione multipla
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Carica i dati all'avvio
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Filtra i record quando cambiano i filtri
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filtroLocalita, filtroProvincia, filtroTipo, filtroGLS, records]);
  
  // Calcola le opzioni dei filtri quando cambiano i records
  useEffect(() => {
    if (records.length > 0) {
      // Estrai le località uniche
      const localita = [...new Set(records
        .filter(r => r.localita)
        .map(r => r.localita))]
        .sort();
      
      // Estrai le province uniche
      const province = [...new Set(records
        .filter(r => r.provincia)
        .map(r => r.provincia))]
        .sort();
      
      setLocalitaList(localita);
      setProvinciaList(province);
    }
  }, [records]);
  
  // Ordina i record filtrati in base ai criteri di ordinamento
  const sortedRecords = useMemo(() => {
    // Crea una copia dei dati filtrati
    const dataToSort = [...filteredRecords];
    
    // Definisci una funzione di confronto per l'ordinamento
    const compareFunction = (a, b) => {
      // Gestisci i valori null/undefined
      if (!a[orderBy] && !b[orderBy]) return 0;
      if (!a[orderBy]) return 1;
      if (!b[orderBy]) return -1;
      
      // Confronta stringhe ignorando maiuscole/minuscole
      const valueA = String(a[orderBy]).toLowerCase();
      const valueB = String(b[orderBy]).toLowerCase();
      
      // Esegui il confronto in base alla direzione
      if (orderDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    };
    
    // Ordina i dati
    return dataToSort.sort(compareFunction);
  }, [filteredRecords, orderBy, orderDirection]);
  
  // Funzione di gestione della richiesta di ordinamento
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Carica tutti i dati
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Carica clienti e partner
      const [clientiResult, partnerResult] = await Promise.all([
        loadData('clienti'),
        loadData('partner')
      ]);
      
      if (clientiResult.success && partnerResult.success) {
        // Unisci i dati di clienti e partner
        const allRecords = [
          ...clientiResult.data.map(c => ({ ...c, tipoRecord: 'Cliente' })),
          ...partnerResult.data.map(p => ({ ...p, tipoRecord: 'Partner' }))
        ];
        
        setRecords(allRecords);
        setFilteredRecords(allRecords);
        console.log(`Caricati ${allRecords.length} record totali (${clientiResult.data.length} clienti, ${partnerResult.data.length} partner)`);
      } else {
        const errorMsg = [];
        if (!clientiResult.success) errorMsg.push(`Clienti: ${clientiResult.error}`);
        if (!partnerResult.success) errorMsg.push(`Partner: ${partnerResult.error}`);
        
        console.error('Errore nel caricamento dei dati:', errorMsg.join(', '));
        showSnackbar(`Errore nel caricamento dei dati: ${errorMsg.join(', ')}`, 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      showSnackbar('Errore nel caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Applica i filtri
  const applyFilters = () => {
    let filtered = [...records];
    
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
    
    // Applica filtro località
    if (filtroLocalita !== '') {
      filtered = filtered.filter(item => item.localita === filtroLocalita);
    }
    
    // Applica filtro provincia
    if (filtroProvincia !== '') {
      filtered = filtered.filter(item => item.provincia === filtroProvincia);
    }
    
    // Applica filtro tipo
    if (filtroTipo !== '') {
      filtered = filtered.filter(item => item.tipoRecord === filtroTipo);
    }
    
    // Applica filtro GLS
    if (filtroGLS !== '') {
      const value = filtroGLS === 'si';
      filtered = filtered.filter(item => {
        const isGLS = item.gls === '1' || item.gls === 1 || item.gls === true;
        return filtroGLS === 'si' ? isGLS : !isGLS;
      });
    }
    
    setFilteredRecords(filtered);
    
    // Resetta la selezione quando cambiano i filtri
    setSelected([]);
    setSelectAll(false);
    
    // Reimposta la pagina a 0
    setPage(0);
  };
  
  // Esporta dati per GLS
  const handleExportGLS = async () => {
    try {
      setLoading(true);
      showSnackbar('Esportazione in corso...', 'info');
      
      const result = await exportGLS();
      
      if (result.success) {
        showSnackbar('Esportazione completata con successo', 'success');
      } else {
        showSnackbar(`Errore nell'esportazione: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      showSnackbar('Errore durante l\'esportazione', 'error');
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
  
  // Gestione selezione
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Seleziona tutti gli elementi filtrati nella pagina corrente
      const currentPageIds = sortedRecords
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(item => item.id);
      
      setSelected(currentPageIds);
    } else {
      // Deseleziona tutti
      setSelected([]);
    }
  };
  
  const handleSelectItem = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      // Aggiungi alla selezione
      newSelected = [...selected, id];
    } else {
      // Rimuovi dalla selezione
      newSelected = selected.filter(itemId => itemId !== id);
    }
    
    setSelected(newSelected);
  };
  
  const isSelected = (id) => selected.includes(id);
  
  // Assegna o rimuovi GLS ai record selezionati
  const handleAssignGLS = async (value) => {
    if (selected.length === 0) {
      showSnackbar('Nessun elemento selezionato', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      
      const successResults = [];
      
      // Gestisci clienti e partner separatamente
      const selectedRecords = records.filter(r => selected.includes(r.id));
      const clientiIds = selectedRecords.filter(r => r.tipo === 'clienti').map(r => r.id);
      const partnerIds = selectedRecords.filter(r => r.tipo === 'partner').map(r => r.id);
      
      // Aggiorna i clienti selezionati
      if (clientiIds.length > 0) {
        const clientiResult = await updateBulk('clienti', clientiIds, 'gls', value ? '1' : '');
        if (clientiResult.success) {
          successResults.push(`${clientiIds.length} clienti`);
        }
      }
      
      // Aggiorna i partner selezionati
      if (partnerIds.length > 0) {
        const partnerResult = await updateBulk('partner', partnerIds, 'gls', value ? '1' : '');
        if (partnerResult.success) {
          successResults.push(`${partnerIds.length} partner`);
        }
      }
      
      // Ricarica i dati aggiornati
      await loadAllData();
      
      // Mostra notifica
      if (successResults.length > 0) {
        showSnackbar(`GLS ${value ? 'assegnato' : 'rimosso'} per ${successResults.join(' e ')}`, 'success');
      } else {
        showSnackbar('Nessun record aggiornato', 'warning');
      }
      
      // Resetta la selezione
      setSelected([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      showSnackbar('Errore durante l\'aggiornamento', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFiltroLocalita('');
    setFiltroProvincia('');
    setFiltroTipo('');
    setFiltroGLS('');
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
  
  // Componente per la cella di intestazione ordinabile
  const SortableTableCell = ({ label, field }) => {
    return (
      <TableCell>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer' 
          }}
          onClick={() => handleRequestSort(null, field)}
        >
          <Typography component="span" variant="inherit">
            {label}
          </Typography>
          <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
            {orderBy === field ? (
              orderDirection === 'asc' ? (
                <ArrowUpwardIcon fontSize="small" />
              ) : (
                <ArrowDownwardIcon fontSize="small" />
              )
            ) : (
              <SortIcon fontSize="small" sx={{ opacity: 0.5 }} />
            )}
          </Box>
        </Box>
      </TableCell>
    );
  };

  // Renderizzazione dell'interfaccia UI
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Spedizioni GLS</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleExportGLS}
            disabled={loading}
            color="secondary"
          >
            Esporta GLS
          </Button>
        </Box>
      </Box>
      
      {/* Filtri e Ricerca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, 
          gap: 2,
          alignItems: 'center',
          mb: 2
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
            <InputLabel>Località</InputLabel>
            <Select
              value={filtroLocalita}
              label="Località"
              onChange={(e) => setFiltroLocalita(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {localitaList.map(localita => (
                <MenuItem key={localita} value={localita}>{localita}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>Provincia</InputLabel>
            <Select
              value={filtroProvincia}
              label="Provincia"
              onChange={(e) => setFiltroProvincia(e.target.value)}
            >
              <MenuItem value="">Tutte</MenuItem>
              {provinciaList.map(provincia => (
                <MenuItem key={provincia} value={provincia}>{provincia}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr auto' }, 
          gap: 2,
          alignItems: 'center'
        }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filtroTipo}
              label="Tipo"
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="Cliente">Clienti</MenuItem>
              <MenuItem value="Partner">Partner</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" fullWidth>
            <InputLabel>GLS</InputLabel>
            <Select
              value={filtroGLS}
              label="GLS"
              onChange={(e) => setFiltroGLS(e.target.value)}
            >
              <MenuItem value="">Tutti</MenuItem>
              <MenuItem value="si">Da spedire</MenuItem>
              <MenuItem value="no">Non da spedire</MenuItem>
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
      
      {/* Azioni di gruppo */}
      {selected.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography>
            {selected.length} {selected.length === 1 ? 'elemento selezionato' : 'elementi selezionati'}
          </Typography>
          
          <Button
            variant="contained"
            size="small"
            color="secondary"
            startIcon={<LocalShippingIcon />}
            onClick={() => handleAssignGLS(true)}
          >
            Assegna GLS
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={() => handleAssignGLS(false)}
          >
            Rimuovi GLS
          </Button>
        </Box>
      )}
      
      {/* Tabella Record */}
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        inputProps={{ 'aria-label': 'select all' }}
                      />
                    </TableCell>
                    <TableCell>Tipo</TableCell>
                    <SortableTableCell 
                      label="Nome" 
                      field="nome"
                    />
                    <SortableTableCell
                      label="Azienda"
                      field="azienda"
                    />
                    <TableCell>Indirizzo</TableCell>
                    <TableCell>CAP</TableCell>
                    <TableCell>Località</TableCell>
                    <TableCell>Prov.</TableCell>
                    <TableCell>Telefono</TableCell>
                    <TableCell align="center">GLS</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    sortedRecords
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record) => {
                        const isItemSelected = isSelected(record.id);
                        const isGLS = record.gls === '1' || record.gls === 1 || record.gls === true;
                        
                        return (
                          <TableRow 
                            key={record.id}
                            hover
                            selected={isItemSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isItemSelected}
                                onChange={() => handleSelectItem(record.id)}
                                inputProps={{ 'aria-labelledby': `record-${record.id}` }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={record.tipoRecord} 
                                color={record.tipoRecord === 'Cliente' ? 'primary' : 'secondary'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{record.nome}</TableCell>
                            <TableCell>{record.azienda}</TableCell>
                            <TableCell>
                              {record.indirizzo} {record.civico ? record.civico : ''}
                            </TableCell>
                            <TableCell>{record.cap}</TableCell>
                            <TableCell>{record.localita}</TableCell>
                            <TableCell>{record.provincia}</TableCell>
                            <TableCell>{record.telefono}</TableCell>
                            <TableCell align="center">
                              {isGLS ? (
                                <Tooltip title="Spedizione GLS attiva">
                                  <CheckCircleIcon color="success" />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Nessuna spedizione GLS">
                                  <CancelIcon color="disabled" />
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        Nessun record trovato
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredRecords.length}
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

export default SpedizioniPage;