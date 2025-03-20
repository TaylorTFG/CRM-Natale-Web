FROM python:3.9-slim as backend

WORKDIR /app/backend

# Installa dipendenze
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice backend
COPY backend/ .

# Crea directory per gli upload
RUN mkdir -p uploads

# Fase di build per il frontend
FROM node:16 as frontend-build

WORKDIR /app/frontend

# Copia package.json e installa le dipendenze
COPY frontend/package*.json ./
RUN npm install

# Copia il codice sorgente del frontend
COPY frontend/ .

# Costruisci l'app frontend
RUN npm run build

# Fase finale che combina backend e frontend
FROM backend as final

# Copia i file del frontend build
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Esponi la porta
EXPOSE 5000

# Imposta variabili d'ambiente
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5000

# Comando di avvio
CMD ["python", "app.py"]