# CRM Natale - Web Edition

CRM per la gestione di regali natalizi, clienti, partner e spedizioni.

## Descrizione

Questo progetto è una versione web del CRM Natale, originariamente sviluppato come applicazione desktop con Electron. La versione web mantiene tutte le funzionalità principali ma è ottimizzata per essere eseguita in un browser e ospitata su servizi di hosting gratuiti o commerciali.

### Funzionalità principali

- Gestione clienti e partner
- Gestione regali natalizi
- Configurazione dei consegnatari
- Spedizioni tramite GLS
- Importazione ed esportazione in formato Excel
- Cestino per elementi eliminati con possibilità di ripristino

## Tecnologie utilizzate

### Backend
- Python 3.8+
- Flask (framework web)
- SQLAlchemy (ORM per database)
- SQLite (database di sviluppo)
- Flask-CORS (per la gestione delle richieste cross-origin)
- Pandas e Openpyxl (per l'elaborazione di file Excel)

### Frontend
- React 18
- Material UI 5 (componenti UI)
- React Router (navigazione)
- Axios (client HTTP)

## Installazione e avvio

### Prerequisiti
- Python 3.8+
- Node.js 16+ e npm/yarn

### Backend

1. Clona il repository:
```bash
git clone https://github.com/tuousername/crm-natale-web.git
cd crm-natale-web/backend
```

2. Crea un ambiente virtuale Python e attivalo:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate  # Windows
```

3. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

4. Avvia il server di sviluppo:
```bash
python app.py
```

Il server sarà in esecuzione su http://localhost:5000

### Frontend

1. Naviga nella cartella frontend:
```bash
cd ../frontend
```

2. Installa le dipendenze:
```bash
npm install
# oppure
yarn install
```

3. Avvia il server di sviluppo:
```bash
npm start
# oppure
yarn start
```

L'applicazione sarà disponibile su http://localhost:3000

## Deployment

### Opzioni di hosting gratuite

#### Backend
- [PythonAnywhere](https://www.pythonanywhere.com/) - Piano gratuito
- [Render](https://render.com/) - Piano gratuito
- [Heroku](https://www.heroku.com/) - Piano hobby gratuito

#### Frontend
- [Vercel](https://vercel.com/) - Piano gratuito
- [Netlify](https://www.netlify.com/) - Piano gratuito
- [GitHub Pages](https://pages.github.com/) - Gratuito per repository pubblici

### Istruzioni per il deployment

#### Preparazione per il deployment

1. Per il backend, assicurati di configurare correttamente il database:
   - In sviluppo viene utilizzato SQLite
   - In produzione puoi utilizzare MySQL o PostgreSQL modificando la variabile `DATABASE_URL` nel file `.env`

2. Per il frontend, modifica il file `.env` per puntare al backend:
```
REACT_APP_API_URL=https://tuo-backend-url.com/api
```

#### Build del progetto

1. Build del backend:
   - Non è necessario, ma assicurati che i file `.env` siano configurati correttamente

2. Build del frontend:
```bash
cd frontend
npm run build
# oppure
yarn build
```

## Migrazione da hosting gratuito a hosting commerciale

Per migrare il progetto:

1. Esporta il database dall'hosting gratuito
2. Importa il database nel nuovo hosting
3. Aggiorna le variabili d'ambiente, in particolare `DATABASE_URL`
4. Ricostruisci il frontend con il nuovo URL del backend, se necessario

## Struttura del progetto

```
crm-natale/
├── backend/
│   ├── app.py               # Applicazione principale
│   ├── database.py          # Configurazione DB
│   ├── models.py            # Modelli DB
│   ├── routes/              # API routes
│   │   ├── contatti.py      # API per clienti e partner
│   │   ├── impostazioni.py  # API per impostazioni
│   │   └── excel.py         # API per import/export
│   ├── uploads/             # Cartella temporanea per upload
│   └── requirements.txt     # Dipendenze Python
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Licenza

Questo progetto è distribuito con licenza MIT. Vedere il file LICENSE per ulteriori dettagli.