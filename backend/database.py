from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv

# Carica variabili d'ambiente
load_dotenv()

# Inizializzazione dell'oggetto SQLAlchemy
db = SQLAlchemy()

def init_db(app):
    """Inizializza il database con l'applicazione Flask"""
    database_url = os.getenv('DATABASE_URL', 'sqlite:///crm_natale.db')
    
    # Controlla se l'URL è per PostgreSQL e ha il formato corretto
    # Render fornisce URL che iniziano con postgres://, ma SQLAlchemy si aspetta postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    # Configura il database
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inizializza il database con l'app
    db.init_app(app)
    
    # Crea tutte le tabelle se non esistono
    with app.app_context():
        try:
            db.create_all()
            print(f"Database inizializzato con successo: {database_url.split('@')[0].split('://')[0]}")
        except Exception as e:
            print(f"Errore durante l'inizializzazione del database: {e}")
            # Se siamo in sviluppo, possiamo fallback su SQLite
            if 'DATABASE_URL' not in os.environ and not database_url.startswith('postgresql://'):
                fallback_url = 'sqlite:///crm_natale.db'
                print(f"Tentativo di fallback su SQLite: {fallback_url}")
                app.config['SQLALCHEMY_DATABASE_URI'] = fallback_url
                db.init_app(app)
                db.create_all()
