import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientiPage from './pages/ClientiPage';
import PartnerPage from './pages/PartnerPage';
import SpedizioniPage from './pages/SpedizioniPage';
import SettingsPage from './pages/SettingsPage';
import EliminatiPage from './pages/EliminatiPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clienti" element={<ClientiPage />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/spedizioni" element={<SpedizioniPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/eliminati" element={<EliminatiPage />} />
      </Routes>
    </Layout>
  );
}

export default App;