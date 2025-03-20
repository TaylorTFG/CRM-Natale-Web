import axios from 'axios';

// Crea un'istanza di Axios con configurazione di base
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercettore per la gestione degli errori
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API per il caricamento dei dati
export const loadData = async (dataType, includeEliminati = false) => {
  try {
    const response = await apiClient.get(`/${dataType}`, {
      params: { include_eliminati: includeEliminati }
    });
    return response.data;
  } catch (error) {
    console.error(`Errore durante il caricamento dei dati ${dataType}:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

// API per il salvataggio dei dati
export const saveData = async (dataType, data) => {
  try {
    const response = await apiClient.post(`/${dataType}`, data);
    return response.data;
  } catch (error) {
    console.error(`Errore durante il salvataggio dei dati ${dataType}:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

// API per l'importazione da Excel
export const importExcel = async (dataType, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/import-excel/${dataType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Errore durante l'importazione Excel:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message 
    };
  }
};

// API per l'esportazione per GLS
export const exportGLS = async () => {
  try {
    const response = await apiClient.get('/export-gls', {
      responseType: 'blob'
    });
    
    // Crea un URL per il blob e avvia il download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Spedizioni_GLS.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  } catch (error) {
    console.error(`Errore durante l'esportazione GLS:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message 
    };
  }
};

// API per le impostazioni
export const loadSettings = async () => {
  try {
    const response = await apiClient.get('/settings');
    return response.data;
  } catch (error) {
    console.error('Errore durante il caricamento delle impostazioni:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const saveSettings = async (settings) => {
  try {
    const response = await apiClient.post('/settings', settings);
    return response.data;
  } catch (error) {
    console.error('Errore durante il salvataggio delle impostazioni:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

// API per la gestione degli eliminati
export const moveToEliminati = async (dataType, id) => {
  try {
    const response = await apiClient.post(`/move-to-eliminati/${dataType}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante lo spostamento negli eliminati:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const restoreFromEliminati = async (id) => {
  try {
    const response = await apiClient.post(`/restore-from-eliminati/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante il ripristino dagli eliminati:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const deleteFromEliminati = async (id) => {
  try {
    const response = await apiClient.delete(`/eliminati/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore durante l\'eliminazione definitiva:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export const emptyTrash = async () => {
  try {
    const response = await apiClient.delete('/eliminati');
    return response.data;
  } catch (error) {
    console.error('Errore durante lo svuotamento del cestino:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

// API per aggiornamenti di gruppo
export const updateBulk = async (dataType, ids, propertyName, propertyValue) => {
  try {
    const response = await apiClient.post(`/update-bulk/${dataType}`, {
      ids,
      propertyName,
      propertyValue
    });
    return response.data;
  } catch (error) {
    console.error(`Errore durante l'aggiornamento bulk:`, error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
};

export default {
  loadData,
  saveData,
  importExcel,
  exportGLS,
  loadSettings,
  saveSettings,
  moveToEliminati,
  restoreFromEliminati,
  deleteFromEliminati,
  emptyTrash,
  updateBulk
};