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
    
    # Configura il database
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inizializza il database con l'app
    db.init_app(app)
    
    # Crea tutte le tabelle se non esistono
    with app.app_context():
        db.create_all()