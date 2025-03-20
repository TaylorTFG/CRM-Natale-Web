from database import db
from datetime import datetime
import json

class BaseModel:
    """Classe base per i modelli con metodi di utilità"""
    
    def to_dict(self):
        """Converte l'oggetto in un dizionario"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # Gestione di tipi di dati speciali
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result
    
    def to_json(self):
        """Converte l'oggetto in una stringa JSON"""
        return json.dumps(self.to_dict())

class Contatto(db.Model, BaseModel):
    """Modello per Clienti e Partner"""
    __tablename__ = 'contatti'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False)  # 'clienti' o 'partner'
    nome = db.Column(db.String(100), nullable=False)
    azienda = db.Column(db.String(100))
    indirizzo = db.Column(db.String(200))
    civico = db.Column(db.String(20))
    cap = db.Column(db.String(10))
    localita = db.Column(db.String(100))
    provincia = db.Column(db.String(2))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))
    note = db.Column(db.Text)
    tipologia = db.Column(db.String(50))  # Solo per partner
    grappa = db.Column(db.Boolean, default=False)
    extraAltro = db.Column(db.Text)
    consegnaSpedizione = db.Column(db.String(100))
    gls = db.Column(db.Boolean, default=False)
    eliminato = db.Column(db.Boolean, default=False)
    eliminatoIl = db.Column(db.DateTime)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    lastUpdate = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Contatto {self.nome} ({self.tipo})>"

class Impostazione(db.Model, BaseModel):
    """Modello per le impostazioni dell'applicazione"""
    __tablename__ = 'impostazioni'
    
    id = db.Column(db.Integer, primary_key=True)
    chiave = db.Column(db.String(50), unique=True, nullable=False)
    valore = db.Column(db.Text, nullable=False)
    
    def __repr__(self):
        return f"<Impostazione {self.chiave}>"

# Funzioni di inizializzazione dati predefiniti
def init_default_settings():
    """Inizializza le impostazioni predefinite"""
    defaults = {
        'regaloCorrente': 'Grappa',
        'annoCorrente': str(datetime.now().year),
        'consegnatari': json.dumps([
            'Andrea Gosgnach',
            'Marco Crasnich',
            'Massimo Cendron',
            'Matteo Rocchetto'
        ])
    }
    
    for chiave, valore in defaults.items():
        # Controlla se l'impostazione esiste già
        setting = Impostazione.query.filter_by(chiave=chiave).first()
        if not setting:
            # Crea nuova impostazione con il valore predefinito
            new_setting = Impostazione(chiave=chiave, valore=valore)
            db.session.add(new_setting)
    
    # Salva le modifiche
    db.session.commit()