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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';

// Import API
import { loadData, saveData, importExcel, exportGLS, loadSettings, moveToEliminati, updateBulk } from '../api/apiClient';

const ClientiPage = () => {
  // Stato per i dati dei clienti
  const [clienti, setClienti] = useState([]);
  const [filteredClienti, setFilteredClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per la paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Stato per la ricerca e i filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocalita, setFiltroLocalita] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroGrappa, setFiltroGrappa] = useState('');
  const [filtroConsegna, setFiltroConsegna] = useState('');
  const [filtroGLS, setFiltroGLS] = useState('');
  
  // Stato per l'ordinamento
  const [orderBy, setOrderBy] = useState('nome');
  const [orderDirection, setOrderDirection] = useState('asc');
  
  // Lista delle località e province per i filtri
  const [localitaList, setLocalitaList] = useState([]);
  const [provinciaList, setProvinciaList] = useState([]);
  
  // Stato per il dialog di modifica/aggiunta
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    azienda: '',
    indirizzo: '',
    civico: '',
    cap: '',
    localita: '',
    provincia: '',
    telefono: '',
    email: '',
    note: '',
    grappa: '',
    extraAltro: '',
    consegnaSpedizione: '',
    gls: ''
  });
  
  // Stato per la selezione multipla
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Stato per le impostazioni
  const [settings, setSettings] = useState({
    regaloCorrente: 'Grappa',
    annoCorrente: new Date().getFullYear(),
    consegnatari: []
  });
  
  // Stato per il menu delle azioni di gruppo
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  
  // Stato per i dialoghi delle azioni di gruppo
  const [openAssegnaRegaloDialog, setOpenAssegnaRegaloDialog] = useState(false);
  const [openAssegnaConsegnaDialog, setOpenAssegnaConsegnaDialog] = useState(false);
  const [openAssegnaGLSDialog, setOpenAssegnaGLSDialog] = useState(false);
  const [valoreDaAssegnare, setValoreDaAssegnare] = useState('');
  
  // Stato per le notifiche
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Carica i dati all'avvio
  useEffect(() => {
    Promise.all([
      loadClienti(),
      loadAppSettings()
    ]);
  }, []);
  
  // Filtra i clienti quando cambiano i filtri
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filtroLocalita, filtroProvincia, filtroGrappa, filtroConsegna, filtroGLS, clienti]);
  
  // Calcola le opzioni dei filtri quando cambiano i clienti
  useEffect(() => {
    if (clienti.length > 0) {
      // Estrai le località uniche
      const localita = [...new Set(clienti
        .filter(c => c.localita)
        .map(c => c.localita))]
        .sort();
      
      // Estrai le province uniche
      const province = [...new Set(clienti
        .filter(c => c.provincia)
        .map(c => c.provincia))]
        .sort();
      
      setLocalitaList(localita);
      setProvinciaList(province);
    }
  }, [clienti]);
  
  // Ordina i clienti filtrati in base ai criteri di ordinamento
  const sortedClienti = useMemo(() => {
    // Crea una copia dei dati filtrati
    const dataToSort = [...filteredClienti];
    
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
  }, [filteredClienti, orderBy, orderDirection]);
  
  // Funzione di gestione della richiesta di ordinamento
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Carica i clienti dal backend
  const loadClienti = async () => {
    try {
      setLoading(true);
      const result = await loadData('clienti');
      
      if (result.success) {
        // Ordina i clienti per nome
        const sortedData = result.data.sort((a, b) => 
          a.nome && b.nome ? a.nome.localeCompare(b.nome) : 0
        );
        
        setClienti(sortedData);
        setFilteredClienti(sortedData);
        console.log('Caricati ' + result.data.length + ' clienti');
      } else {
        console.error('Errore nel caricamento dei clienti:', result.error);
        showSnackbar('Errore nel caricamento dei clienti', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei clienti:', error);
      showSnackbar('Errore nel caricamento dei clienti', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le impostazioni
  const loadAppSettings = async () => {
    try {
      const result = await loadSettings();
      
      if (result.success && result.data) {
        // Assicurati che consegnatari sia un array
        setSettings({
          regaloCorrente: result.data.regaloCorrente || 'Grappa',
          annoCorrente: result.data.annoCorrente || new Date().getFullYear(),
          consegnatari: Array.isArray(result.data.consegnatari) ? result.data.consegnatari : []
        });
        console.log('Impostazioni caricate:', result.data);
      } else {
        console.error('Errore nel caricamento delle impostazioni:', result.error);
        // Mantieni i valori iniziali in caso di errore
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni:', error);
    }
  };
  
  // Applica i filtri
  const applyFilters = () => {
    let filtered = [...clienti];
    
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
    
    // Applica filtro grappa
    if (filtroGrappa !== '') {
      const value = filtroGrappa === 'si' ? '1' : '';
      filtered = filtered.filter(item => 
        item.grappa === value || 
        item.grappa === (value === '1' ? 1 : '') || 
        item.grappa === (value === '1' ? true : false)
      );
    }
    
    // Applica filtro consegna
    if (filtroConsegna !== '') {
      // Se "Non assegnato", filtra per consegna vuota
      if (filtroConsegna === 'non_assegnato') {
        filtered = filtered.filter(item => !item.consegnaSpedizione);
      } else {
        filtered = filtered.filter(item => item.consegnaSpedizione === filtroConsegna);
      }
    }
    
    // Applica filtro GLS
    if (filtroGLS !== '') {
      const value = filtroGLS === 'si' ? '1' : '';
      filtered = filtered.filter(item => 
        item.gls === value || 
        item.gls === (value === '1' ? 1 : '') || 
        item.gls === (value === '1' ? true : false)
      );
    }
      
    setFilteredClienti(filtered);
    
    // Resetta la selezione quando cambiano i filtri
    setSelected([]);
    setSelectAll(false);
    
    // Reimposta la pagina a 0
    setPage(0);
  };
  
  // Importa dati da Excel
  const handleImportExcel = async () => {
    try {
      setLoading(true);
      showSnackbar('Importazione in corso...', 'info');
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const result = await importExcel('clienti', file);
        
        if (result.success) {
          setClienti(result.data);
          showSnackbar('Importazione completata: ' + (result.data?.length || 0) + ' clienti', 'success');
        } else {
          showSnackbar(\`Errore nell'importazione: \${result.message}\`, 'error');
        }
        
        setLoading(false);
      };
      
      input.click();
    } catch (error) {
      console.error('Errore durante l\\'importazione:', error);
      showSnackbar('Errore durante l\\'importazione', 'error');
      setLoading(false);
    }
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
        showSnackbar(\`Errore nell'esportazione: \${result.message}\`, 'error');
      }
    } catch (error) {
      console.error('Errore durante l\\'esportazione:', error);
      showSnackbar('Errore durante l\\'esportazione', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestione paginazione
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Non resettare la selezione quando si cambia pagina
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestione checkbox per grappa e GLS
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? '1' : ''
    }));
  };
  
  // Apri dialog per nuovo cliente
  const handleAddCliente = () => {
    setCurrentCliente(null);
    setFormData({
      nome: '',
      azienda: '',
      indirizzo: '',
      civico: '',
      cap: '',
      localita: '',
      provincia: '',
      telefono: '',
      email: '',
      note: '',
      grappa: '',
      extraAltro: '',
      consegnaSpedizione: '',
      gls: ''
    });
    setOpenDialog(true);
  };
  
  // Apri dialog per modifica cliente
  const handleEditCliente = (cliente) => {
    setCurrentCliente(cliente);
    setFormData({
      nome: cliente.nome || '',
      azienda: cliente.azienda || '',
      indirizzo: cliente.indirizzo || '',
      civico: cliente.civico || '',
      cap: cliente.cap || '',
      localita: cliente.localita || '',
      provincia: cliente.provincia || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      note: cliente.note || '',
      grappa: cliente.grappa || '',
      extraAltro: cliente.extraAltro || '',
      consegnaSpedizione: cliente.consegnaSpedizione || '',
      gls: cliente.gls || ''
    });
    setOpenDialog(true);
  };
  
  // Chiudi dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Salva cliente
  const handleSaveCliente = async () => {
    // Validazione basica
    if (!formData.nome) {
      showSnackbar('Il nome è obbligatorio', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      let updatedClienti;
      
      if (currentCliente) {
        // Aggiornamento cliente esistente
        const updatedCliente = {
          ...currentCliente,
          ...formData,
          lastUpdate: Date.now()
        };
        
        updatedClienti = clienti.map(c => 
          c.id === currentCliente.id ? updatedCliente : c
        );
        
        showSnackbar('Cliente aggiornato con successo', 'success');
      } else {
        // Nuovo cliente
        const newCliente = {
          ...formData,
          id: Date.now(),
          tipo: 'clienti',
          eliminato: false,
          createdAt: Date.now()
        };
        
        updatedClienti = [...clienti, newCliente];
        showSnackbar('Cliente creato con successo', 'success');
      }
      
      // Aggiorna lo stato
      setClienti(updatedClienti);
      
      // Salva nel backend
      await saveData('clienti', updatedClienti);
      
      // Chiudi dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      showSnackbar('Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Elimina cliente
  const handleDeleteCliente = async (cliente) => {
    if (window.confirm(\`Sei sicuro di voler eliminare il cliente "\${cliente.nome}"?\`)) {
      try {
        setLoading(true);
        
        // Sposta il cliente negli eliminati
        const result = await moveToEliminati('clienti', cliente.id);
        
        if (result.success) {
          // Aggiorna lo stato locale
          setClienti(prev => prev.filter(c => c.id !== cliente.id));
          
          showSnackbar('Cliente eliminato con successo', 'success');
        } else {
          console.error('Errore durante l\\'eliminazione:', result.error);
          showSnackbar('Errore durante l\\'eliminazione', 'error');
        }
      } catch (error) {
        console.error('Errore durante l\\'eliminazione:', error);
        showSnackbar('Errore durante l\\'eliminazione', 'error');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Gestione selezione
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Seleziona tutti gli elementi filtrati nella pagina corrente
      const currentPageIds = sortedClienti
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(item => item.id);
      
      setSelected(currentPageIds);
    } else {
      // Deseleziona tutti
      setSelected([]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selected.length === filteredClienti.length) {
      // Se sono già selezionati tutti, deseleziona
      setSelected([]);
      setSelectAll(false);
    } else {
      // Altrimenti seleziona tutti i filtrati
      const allFilteredIds = filteredClienti.map(item => item.id);
      setSelected(allFilteredIds);
      setSelectAll(true);
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
  
  // Gestione menu azioni di gruppo
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // Azioni di gruppo
  const handleAssegnaRegalo = () => {
    setValoreDaAssegnare('1');
    setOpenAssegnaRegaloDialog(true);
    handleCloseMenu();
  };
  
  // Funzione per l'eliminazione multipla
  const handleBulkDelete = () => {
    if (selected.length === 0) {
      showSnackbar('Nessun elemento selezionato', 'warning');
      return;
    }
    
    if (window.confirm(\`Sei sicuro di voler eliminare \${selected.length} \${selected.length === 1 ? 'cliente' : 'clienti'}? Questa azione non può essere annullata immediatamente.\`)) {
      handleDeleteBulk();
    }
    
    handleCloseMenu();
  };

  // Funzione per eseguire l'eliminazione multipla
  const handleDeleteBulk = async () => {
    try {
      setLoading(true);
      
      // Crea una copia dell'array clienti
      let updatedClienti = [...clienti];
      let successCount = 0;
      
      // Elimina ogni cliente selezionato
      for (const id of selected) {
        try {
          // Sposta il cliente negli eliminati
          const result = await moveToEliminati('clienti', id);
          
          if (result.success) {
            // Rimuovi il cliente dall'array
            updatedClienti = updatedClienti.filter(c => c.id !== id);
            successCount++;
          } else {
            console.error(\`Errore durante l'eliminazione del cliente con ID \${id}:\`, result.error);
          }
        } catch (error) {
          console.error(\`Errore durante l'eliminazione del cliente con ID \${id}:\`, error);
        }
      }
      
      // Aggiorna lo stato
      setClienti(updatedClienti);
      
      // Resetta la selezione
      setSelected([]);
      setSelectAll(false);
      
      showSnackbar(\`Eliminati con successo \${successCount} \${successCount === 1 ? 'cliente' : 'clienti'}\`, 'success');
    } catch (error) {
      console.error('Errore durante l\\'eliminazione multipla:', error);
      showSnackbar('Errore durante l\\'eliminazione multipla', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssegnaConsegna = () => {
    setValoreDaAssegnare('');
    setOpenAssegnaConsegnaDialog(true);
    handleCloseMenu();
  };
  
  const handleAssegnaGLS = () => {
    setValoreDaAssegnare('1');
    setOpenAssegnaGLSDialog(true);
    handleCloseMenu();
  };
  
  // Esegui azione di gruppo
  const handleBulkUpdate = async (propertyName, propertyValue) => {
    if (selected.length === 0) {
      showSnackbar('Nessun elemento selezionato', 'warning');
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await updateBulk('clienti', selected, propertyName, propertyValue);
      
      if (result.success) {
        // Aggiorna lo stato locale
        setClienti(result.data);
        
        showSnackbar(\`Aggiornamento completato: \${selected.length} elementi\`, 'success');
        
        // Chiudi i dialoghi
        setOpenAssegnaRegaloDialog(false);
        setOpenAssegnaConsegnaDialog(false);
        setOpenAssegnaGLSDialog(false);
        
        // Resetta la selezione
        setSelected([]);
        setSelectAll(false);
      } else {
        console.error('Errore durante l\\'aggiornamento:', result.error);
        showSnackbar('Errore durante l\\'aggiornamento', 'error');
      }
    } catch (error) {
      console.error('Errore durante l\\'aggiornamento:', error);
      showSnackbar('Errore durante l\\'aggiornamento', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFiltroLocalita('');
    setFiltroProvincia('');
    setFiltroGrappa('');
    setFiltroConsegna('');
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
        <Typography variant="h4">Gestione Clienti</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportExcel}
            disabled={loading}
          >
            Importa Excel
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleExportGLS}
            disabled={loading}
            color="secondary"
          >
            Esporta GLS
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCliente}
            disabled={loading}
          >
            Nuovo Cliente
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
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr auto' }, 
          gap: 2,
          alignItems: 'center'
        }}>
          <FormControl size="small" fullWidth>
  <InputLabel>{settings.regaloCorrente || 'Regalo'}</InputLabel>
  <Select
    value={filtroGrappa}
    label={settings.regaloCorrente || 'Regalo'}
    onChange={(e) => setFiltroGrappa(e.target.value)}
  >
    <MenuItem value="">Tutti</MenuItem>
    <MenuItem value="si">Con regalo</MenuItem>
    <MenuItem value="no">Senza regalo</MenuItem>
  </Select>
</FormControl>

<FormControl size="small" fullWidth>
  <InputLabel>Consegna</InputLabel>
  <Select
    value={filtroConsegna}
    label="Consegna"
    onChange={(e) => setFiltroConsegna(e.target.value)}
  >
    <MenuItem value="">Tutte</MenuItem>
    <MenuItem value="non_assegnato">Non assegnato</MenuItem>
    {(settings.consegnatari || []).map(consegnatario => (
      <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
    ))}
  </Select>
</FormControl>

<FormControl size="small" fullWidth>
  <InputLabel>GLS</InputLabel>
  <Select
    value={filtroGLS}
    label="GLS"
    onChange={(e) => setFiltroGLS(e.target.value)}
  >
    <MenuItem value="">Tutte</MenuItem>
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
      onClick={handleOpenMenu}
    >
      Azioni di gruppo
    </Button>
    
    <Menu
      anchorEl={anchorEl}
      open={openMenu}
      onClose={handleCloseMenu}
    >
      <MenuItem onClick={handleAssegnaRegalo}>
        <ListItemIcon>
          <CardGiftcardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Assegna Regalo</ListItemText>
      </MenuItem>

      <MenuItem onClick={handleBulkDelete}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Elimina Selezionati</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={handleAssegnaConsegna}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Assegna Consegnatario</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={handleAssegnaGLS}>
        <ListItemIcon>
          <LocalShippingIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Assegna Spedizione GLS</ListItemText>
      </MenuItem>
    </Menu>
    
    <Button
      variant="outlined"
      size="small"
      color="primary"
      onClick={handleSelectAllFiltered}
    >
      {selected.length === filteredClienti.length ? 'Deseleziona tutti' : 'Seleziona tutti filtrati'}
    </Button>
  </Box>
)}

{/* Tabella Clienti */}
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
              <TableCell>{settings.regaloCorrente || 'Regalo'}</TableCell>
              <TableCell>Extra</TableCell>
              <TableCell>Consegna</TableCell>
              <TableCell>GLS</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredClienti.length > 0 ? (
              sortedClienti
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((cliente) => {
                  const isItemSelected = isSelected(cliente.id);
                  
                  return (
                    <TableRow 
                      key={cliente.id}
                      hover
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={() => handleSelectItem(cliente.id)}
                          inputProps={{ 'aria-labelledby': 'cliente-' + cliente.id }}
                        />
                      </TableCell>
                      <TableCell>{cliente.nome}</TableCell>
                      <TableCell>{cliente.azienda}</TableCell>
                      <TableCell>
                        {cliente.indirizzo} {cliente.civico ? cliente.civico : ''}
                      </TableCell>
                      <TableCell>{cliente.cap}</TableCell>
                      <TableCell>{cliente.localita}</TableCell>
                      <TableCell>{cliente.provincia}</TableCell>
                      <TableCell>
                        {cliente.grappa === '1' || cliente.grappa === 1 || cliente.grappa === true ? (
                          <Chip 
                            label="Sì" 
                            color="success" 
                            size="small" 
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        {cliente.extraAltro ? (
                          <Tooltip title={cliente.extraAltro}>
                            <Chip 
                              label="Sì" 
                              color="info" 
                              size="small" 
                            />
                          </Tooltip>
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        {cliente.consegnaSpedizione ? (
                          <Tooltip title={cliente.consegnaSpedizione}>
                            <Chip 
                              label={cliente.consegnaSpedizione} 
                              color="primary" 
                              size="small" 
                            />
                          </Tooltip>
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        {cliente.gls === '1' || cliente.gls === 1 || cliente.gls === true ? (
                          <Chip 
                            label="Sì" 
                            color="secondary" 
                            size="small" 
                          />
                        ) : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Modifica">
                          <IconButton 
                            color="primary"
                            onClick={() => handleEditCliente(cliente)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Elimina">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteCliente(cliente)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  Nessun cliente trovato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={filteredClienti.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Righe per pagina:"
        labelDisplayedRows={({ from, to, count }) => from + '-' + to + ' di ' + count}
      />
    </>
  )}
</Paper>

{/* Dialog per aggiunta/modifica */}
<Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
  <DialogTitle>
    {currentCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
  </DialogTitle>
  
  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Nome *"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          fullWidth
          required
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="Azienda"
          name="azienda"
          value={formData.azienda}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={8} md={4}>
        <TextField
          label="Indirizzo"
          name="indirizzo"
          value={formData.indirizzo}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          placeholder="Via/Piazza"
        />
      </Grid>
      
      <Grid item xs={4} md={2}>
        <TextField
          label="N. Civico"
          name="civico"
          value={formData.civico}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={4} md={2}>
        <TextField
          label="CAP"
          name="cap"
          value={formData.cap}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={8} md={4}>
        <TextField
          label="Località"
          name="localita"
          value={formData.localita}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={4} md={2}>
        <TextField
          label="Provincia"
          name="provincia"
          value={formData.provincia}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={8} md={5}>
        <TextField
          label="Telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
        />
      </Grid>
      
      <Grid item xs={12} md={5}>
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          type="email"
        />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }}>Gestione Regali e Spedizioni</Divider>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.grappa === '1' || formData.grappa === 1 || formData.grappa === true}
              onChange={handleCheckboxChange}
              name="grappa"
            />
          }
          label={settings.regaloCorrente || 'Regalo'}
        />
      </Grid>
      
      <Grid item xs={12} md={9}>
        <TextField
          label="Extra/Altro regalo"
          name="extraAltro"
          value={formData.extraAltro}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          placeholder="Descrizione di un eventuale regalo extra o alternativo"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="dense">
          <InputLabel>Consegna/Spedizione</InputLabel>
          <Select
            value={formData.consegnaSpedizione}
            label="Consegna/Spedizione"
            name="consegnaSpedizione"
            onChange={handleInputChange}
          >
            <MenuItem value="">Non assegnato</MenuItem>
            {(settings.consegnatari || []).map(consegnatario => (
              <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.gls === '1' || formData.gls === 1 || formData.gls === true}
              onChange={handleCheckboxChange}
              name="gls"
            />
          }
          label="Spedizione GLS"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          label="Note"
          name="note"
          value={formData.note}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  </DialogContent>
  
  <DialogActions>
    <Button onClick={handleCloseDialog}>Annulla</Button>
    <Button 
      variant="contained" 
      onClick={handleSaveCliente}
      disabled={loading}
    >
      Salva
    </Button>
  </DialogActions>
</Dialog>

{/* Dialog per assegnare regalo */}
<Dialog open={openAssegnaRegaloDialog} onClose={() => setOpenAssegnaRegaloDialog(false)}>
  <DialogTitle>
    Assegna {settings.regaloCorrente || 'Regalo'}
  </DialogTitle>
  
  <DialogContent>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Vuoi assegnare {settings.regaloCorrente || 'il regalo'} a {selected.length} {selected.length === 1 ? 'cliente' : 'clienti'}?
    </Typography>
  </DialogContent>
  
  <DialogActions>
    <Button onClick={() => setOpenAssegnaRegaloDialog(false)}>Annulla</Button>
    <Button 
      variant="contained" 
      onClick={() => handleBulkUpdate('grappa', valoreDaAssegnare)}
      disabled={loading}
      color="success"
    >
      Conferma
    </Button>
  </DialogActions>
</Dialog>

{/* Dialog per assegnare consegnatario */}
<Dialog open={openAssegnaConsegnaDialog} onClose={() => setOpenAssegnaConsegnaDialog(false)}>
  <DialogTitle>
    Assegna Consegnatario
  </DialogTitle>
  
  <DialogContent>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Seleziona il consegnatario per {selected.length} {selected.length === 1 ? 'cliente' : 'clienti'}:
    </Typography>
    
    <FormControl fullWidth margin="dense">
      <InputLabel>Consegna/Spedizione</InputLabel>
      <Select
        value={valoreDaAssegnare}
        label="Consegna/Spedizione"
        name="consegnaSpedizione"
        onChange={(e) => setValoreDaAssegnare(e.target.value)}
      >
        <MenuItem value="">Non assegnato</MenuItem>
        {Array.isArray(settings.consegnatari) && settings.consegnatari.length > 0 ? (
          settings.consegnatari.map(consegnatario => (
            <MenuItem key={consegnatario} value={consegnatario}>{consegnatario}</MenuItem>
          ))
        ) : (
          [
            <MenuItem key="andrea" value="Andrea Gosgnach">Andrea Gosgnach</MenuItem>,
            <MenuItem key="marco" value="Marco Crasnich">Marco Crasnich</MenuItem>,
            <MenuItem key="massimo" value="Massimo Cendron">Massimo Cendron</MenuItem>,
            <MenuItem key="matteo" value="Matteo Rocchetto">Matteo Rocchetto</MenuItem>
          ]
        )}
      </Select>
    </FormControl>
  </DialogContent>
  
  <DialogActions>
    <Button onClick={() => setOpenAssegnaConsegnaDialog(false)}>Annulla</Button>
    <Button 
      variant="contained" 
      onClick={() => handleBulkUpdate('consegnaSpedizione', valoreDaAssegnare)}
      disabled={loading}
    >
      Conferma
    </Button>
  </DialogActions>
</Dialog>

{/* Dialog per assegnare GLS */}
<Dialog open={openAssegnaGLSDialog} onClose={() => setOpenAssegnaGLSDialog(false)}>
  <DialogTitle>
    Assegna Spedizione GLS
  </DialogTitle>
  
  <DialogContent>
    <Typography variant="body1" sx={{ mb: 2 }}>
      Vuoi assegnare la spedizione GLS a {selected.length} {selected.length === 1 ? 'cliente' : 'clienti'}?
    </Typography>
  </DialogContent>
  
  <DialogActions>
    <Button onClick={() => setOpenAssegnaGLSDialog(false)}>Annulla</Button>
    <Button 
      variant="contained" 
      onClick={() => handleBulkUpdate('gls', valoreDaAssegnare)}
      disabled={loading}
      color="secondary"
    >
      Conferma
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

export default ClientiPage;