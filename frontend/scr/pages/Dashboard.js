import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { Link } from 'react-router-dom';

// Import API
import { loadData, loadSettings } from '../api/apiClient';

const Dashboard = () => {
  const [clientiCount, setClientiCount] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Statistiche aggiuntive
  const [stats, setStats] = useState({
    conRegali: 0,
    conAltriRegali: 0,
    daSpedireGLS: 0,
    consegneInterne: {
      total: 0,
      byPerson: []
    },
    nonAssegnati: 0
  });
  
  // Impostazioni
  const [settings, setSettings] = useState({
    regaloCorrente: 'Regalo',
    annoCorrente: new Date().getFullYear(),
    consegnatari: []
  });

  useEffect(() => {
    // Carica i dati al montaggio del componente
    Promise.all([
      loadAllData(),
      loadAppSettings()
    ]);
  }, []);
  
  // Carica le impostazioni
  const loadAppSettings = async () => {
    try {
      const result = await loadSettings();
      
      if (result.success && result.data) {
        setSettings({
          regaloCorrente: result.data.regaloCorrente || 'Regalo',
          annoCorrente: result.data.annoCorrente || new Date().getFullYear(),
          consegnatari: Array.isArray(result.data.consegnatari) ? result.data.consegnatari : []
        });
      }
    } catch (error) {
      console.error('Errore durante il caricamento delle impostazioni:', error);
    }
  };

  // Carica i dati per dashboard
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Carica clienti e partner
      const [clientiResult, partnerResult] = await Promise.all([
        loadData('clienti'),
        loadData('partner')
      ]);
      
      if (clientiResult.success && partnerResult.success) {
        const clienti = clientiResult.data;
        const partner = partnerResult.data;
        
        // Imposta i conteggi base
        setClientiCount(clienti.length);
        setPartnerCount(partner.length);
        
        // Prepara gli elementi recenti
        const recentClienti = clienti
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map(cliente => ({
            ...cliente,
            tipo: 'cliente'
          }));
          
        const recentPartner = partner
          .sort((a, b) => b.id - a.id)
          .slice(0, 5)
          .map(partner => ({
            ...partner,
            tipo: 'partner'
          }));
          
        // Combina e ordina per ID (più recenti prima)
        const combined = [...recentClienti, ...recentPartner]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5);
          
        setRecentItems(combined);
        
        // Calcola statistiche avanzate
        const allRecords = [...clienti, ...partner];
        
        // Conta record con regalo principale
        const conRegali = allRecords.filter(r => 
          r.grappa === '1' || r.grappa === 1 || r.grappa === true
        ).length;
        
        // Conta record con regalo alternativo
        const conAltriRegali = allRecords.filter(r => 
          r.extraAltro && r.extraAltro.trim() !== ''
        ).length;
        
        // Conta record da spedire con GLS
        const daSpedireGLS = allRecords.filter(r => 
          r.gls === '1' || r.gls === 1 || r.gls === true
        ).length;
        
        // Conta consegne interne per persona
        const consegnePerPersona = {};
        const totaleConsegneInterne = allRecords.filter(r => {
          if (r.consegnaSpedizione && r.consegnaSpedizione.trim() !== '') {
            const consegnatario = r.consegnaSpedizione.trim();
            consegnePerPersona[consegnatario] = (consegnePerPersona[consegnatario] || 0) + 1;
            return true;
          }
          return false;
        }).length;
        
        // Converte in array per il rendering
        const consegneByPerson = Object.entries(consegnePerPersona)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        // Conta record senza assegnazione di consegna o GLS
        const nonAssegnati = allRecords.filter(r => {
          const hasGLS = r.gls === '1' || r.gls === 1 || r.gls === true;
          const hasConsegna = r.consegnaSpedizione && r.consegnaSpedizione.trim() !== '';
          return !hasGLS && !hasConsegna && (r.grappa === '1' || r.grappa === 1 || r.grappa === true);
        }).length;
        
        // Aggiorna lo stato con tutte le statistiche
        setStats({
          conRegali,
          conAltriRegali,
          daSpedireGLS,
          consegneInterne: {
            total: totaleConsegneInterne,
            byPerson: consegneByPerson
          },
          nonAssegnati
        });
      }
    } catch (error) {
      console.error('Errore durante il caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcola la percentuale per la barra di progresso
  const calculateProgressPercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Card Conteggio Clienti */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#e3f2fd',
                position: 'relative'
              }}
            >
              <Box display="flex" alignItems="center">
                <PeopleIcon fontSize="small" sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="h6" component="div">
                  Clienti
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 1, textAlign: 'center' }}>
                {clientiCount}
              </Typography>
              
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Button 
                  variant="outlined"
                  component={Link}
                  to="/clienti"
                  size="small"
                >
                  Gestisci
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card Conteggio Partner */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#fce4ec',
                position: 'relative'
              }}
            >
              <Box display="flex" alignItems="center">
                <BusinessIcon fontSize="small" sx={{ mr: 1, color: '#d81b60' }} />
                <Typography variant="h6" component="div">
                  Partner
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 1, textAlign: 'center' }}>
                {partnerCount}
              </Typography>
              
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Button 
                  variant="outlined"
                  component={Link}
                  to="/partner"
                  size="small"
                  color="secondary"
                >
                  Gestisci
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card Regali */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#e8f5e9',
                position: 'relative'
              }}
            >
              <Box display="flex" alignItems="center">
                <CardGiftcardIcon fontSize="small" sx={{ mr: 1, color: '#2e7d32' }} />
                <Typography variant="h6" component="div">
                  {settings.regaloCorrente}
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 1, textAlign: 'center' }}>
                {stats.conRegali}
              </Typography>
              
              <Typography variant="caption" sx={{ position: 'absolute', bottom: 16, left: 16 }}>
                Altri regali: {stats.conAltriRegali}
              </Typography>
              
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Button 
                  variant="outlined"
                  component={Link}
                  to="/settings"
                  size="small"
                  color="success"
                >
                  Opzioni
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card Spedizioni */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                backgroundColor: '#fff8e1',
                position: 'relative'
              }}
            >
              <Box display="flex" alignItems="center">
                <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: '#ff9800' }} />
                <Typography variant="h6" component="div">
                  Spedizioni GLS
                </Typography>
              </Box>
              
              <Typography variant="h3" component="div" sx={{ my: 1, textAlign: 'center' }}>
                {stats.daSpedireGLS}
              </Typography>
              
              <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                <Button 
                  variant="outlined"
                  component={Link}
                  to="/spedizioni"
                  size="small"
                  color="warning"
                >
                  Gestisci
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card Progresso di assegnazione */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Stato Assegnazione Regali
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Con spedizione GLS</Typography>
                  <Typography variant="body2">{stats.daSpedireGLS} / {stats.conRegali}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgressPercentage(stats.daSpedireGLS, stats.conRegali)} 
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Con consegna interna</Typography>
                  <Typography variant="body2">{stats.consegneInterne.total} / {stats.conRegali}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgressPercentage(stats.consegneInterne.total, stats.conRegali)} 
                  color="primary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Non assegnati</Typography>
                  <Typography variant="body2">{stats.nonAssegnati} / {stats.conRegali}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgressPercentage(stats.nonAssegnati, stats.conRegali)} 
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Tooltip title="Totale con regalo assegnato">
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'right' }}>
                  Totale regali: {stats.conRegali}
                </Typography>
              </Tooltip>
            </Paper>
          </Grid>
          
          {/* Card Consegne per Persona */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Consegne per Persona
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {stats.consegneInterne.byPerson.length > 0 ? (
                <List dense>
                  {stats.consegneInterne.byPerson.map((item, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                      <ListItemText 
                        primary={item.name} 
                        secondary={`${item.count} consegne`} 
                      />
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgressPercentage(item.count, stats.consegneInterne.total)} 
                        sx={{ width: '30%', height: 6, borderRadius: 3 }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Nessuna consegna assegnata
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Lista Elementi Recenti */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Elementi Recenti
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {recentItems.length > 0 ? (
                <List>
                  {recentItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem button component={Link} to={`/${item.tipo === 'partner' ? 'partner' : 'clienti'}`}>
                        {item.tipo === 'partner' ? 
                          <BusinessIcon sx={{ mr: 1, color: 'secondary.main' }} fontSize="small" /> : 
                          <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                        }
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle2">
                              {item.nome} {item.azienda ? `- ${item.azienda}` : ''}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="textSecondary">
                              {item.localita}{item.provincia ? ` (${item.provincia})` : ''} - {item.tipo === 'partner' ? 'Partner' : 'Cliente'}
                              {item.grappa === '1' || item.grappa === 1 || item.grappa === true ? 
                                ` - Con ${settings.regaloCorrente}` : ''}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Nessun elemento recente da visualizzare
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;