# Guida al Deployment su Hosting Gratuito

Questa guida fornisce istruzioni dettagliate per il deployment dell'applicazione CRM Natale su diversi servizi di hosting gratuiti.

## Opzione 1: PythonAnywhere + Vercel

Questa configurazione utilizza PythonAnywhere per il backend e Vercel per il frontend.

### Backend su PythonAnywhere

1. Registra un account gratuito su [PythonAnywhere](https://www.pythonanywhere.com/)

2. Dalla dashboard, vai a "Consoles" e apri una console Bash

3. Clona il repository:
```bash
git clone https://github.com/yourusername/crm-natale-web.git
```

4. Configura un ambiente virtuale:
```bash
cd crm-natale-web/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

5. Dalla dashboard, vai a "Web" e clicca su "Add a new web app"
   - Scegli "Flask"
   - Seleziona Python 3.9
   - Imposta il percorso del file WSGI su: `/home/yourusername/crm-natale-web/backend/app.py`

6. Nella sezione "Code", aggiorna il percorso dell'applicazione a:
```
/home/yourusername/crm-natale-web/backend
```

7. Aggiungi variabili d'ambiente nella sezione "WSGI configuration file":
```python
import os
os.environ['DATABASE_URL'] = 'sqlite:////home/yourusername/crm-natale-web/backend/instance/crm_natale.db'
```

8. Clicca su "Reload" per avviare l'applicazione

### Frontend su Vercel

1. Registra un account gratuito su [Vercel](https://vercel.com/)

2. Installa Vercel CLI sul tuo computer:
```bash
npm i -g vercel
```

3. Aggiorna il file `.env` nella cartella frontend:
```
REACT_APP_API_URL=https://yourusername.pythonanywhere.com/api
```

4. Costruisci il frontend:
```bash
cd frontend
npm install
npm run build
```

5. Dalla cartella frontend, esegui:
```bash
vercel login
vercel
```

6. Segui le istruzioni e scegli le impostazioni predefinite

## Opzione 2: Render (Servizio completo)

Render offre un piano gratuito sia per i servizi web che per i database.

1. Registra un account gratuito su [Render](https://render.com/)

2. Crea un nuovo Web Service:
   - Collega il tuo repository GitHub
   - Seleziona il branch principale
   - Nome: "crm-natale-web"
   - Runtime: "Python 3"
   - Build Command: `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build && cd ..`
   - Start Command: `cd backend && gunicorn app:app`

3. Aggiungi variabili d'ambiente:
   - `DATABASE_URL`: `sqlite:///data/crm_natale.db`
   - `FLASK_APP`: `app.py`
   - `PORT`: `10000`

4. Crea una directory persistente:
   - Vai alla sezione "Disks"
   - Aggiungi un disco con mount path a `/data`

5. Effettua il deploy del servizio

## Opzione 3: Heroku

1. Registra un account gratuito su [Heroku](https://www.heroku.com/)

2. Installa Heroku CLI sul tuo computer:
```bash
npm install -g heroku
```

3. Aggiungi un file `Procfile` nella directory principale:
```
web: cd backend && gunicorn app:app
```

4. Crea un'applicazione Heroku:
```bash
heroku login
heroku create crm-natale-web
```

5. Aggiungi il buildpack multi:
```bash
heroku buildpacks:add heroku/python
heroku buildpacks:add heroku/nodejs
```

6. Configura variabili d'ambiente:
```bash
heroku config:set DATABASE_URL=postgres://...  # Usa l'URL del database che Heroku fornisce
heroku config:set FLASK_APP=app.py
```

7. Effettua il deploy:
```bash
git push heroku main
```

## Migrare da un hosting gratuito a un hosting a pagamento

Quando decidi di migrare ad un hosting a pagamento, segui questi passaggi:

1. **Esporta i dati**:
   - Se stai usando SQLite, scarica il file `.db`
   - Se stai usando PostgreSQL, usa `pg_dump`
   - Se stai usando MySQL, usa `mysqldump`

2. **Configura il nuovo server**:
   - Installa le dipendenze necessarie
   - Configura il database
   - Importa i dati esportati

3. **Aggiorna le configurazioni**:
   - Aggiorna il file `.env` con le nuove credenziali del database
   - Aggiorna gli URL nel frontend

4. **Testa l'applicazione** sul nuovo host prima di effettuare lo switch completo

## Note per il debugging

- Se riscontri problemi con CORS, verifica che il backend stia impostando correttamente gli header CORS
- Per debugging in produzione, imposta temporaneamente `FLASK_DEBUG=True`
- Controlla sempre i log dell'applicazione per identificare eventuali errori