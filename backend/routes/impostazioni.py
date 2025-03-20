from flask import Blueprint, request, jsonify
import json
from datetime import datetime
from models import Impostazione, db, init_default_settings

impostazioni_bp = Blueprint('impostazioni', __name__)

@impostazioni_bp.route('/api/settings', methods=['GET'])
def get_settings():
    """Recupera le impostazioni dell'applicazione"""
    try:
        # Controlla se esistono impostazioni
        settings_count = Impostazione.query.count()
        if settings_count == 0:
            # Inizializza le impostazioni predefinite
            init_default_settings()
        
        # Ottieni tutte le impostazioni
        impostazioni = Impostazione.query.all()
        
        # Converti in dizionario
        result = {}
        for setting in impostazioni:
            # Gestione speciale per i campi JSON
            if setting.chiave == 'consegnatari':
                result[setting.chiave] = json.loads(setting.valore)
            elif setting.chiave == 'annoCorrente':
                result[setting.chiave] = int(setting.valore)
            else:
                result[setting.chiave] = setting.valore
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@impostazioni_bp.route('/api/settings', methods=['POST'])
def save_settings():
    """Salva le impostazioni dell'applicazione"""
    data = request.json
    
    try:
        # Aggiorna o crea ogni impostazione
        for key, value in data.items():
            # Per liste, converti in JSON
            if key == 'consegnatari' and isinstance(value, list):
                value = json.dumps(value)
            elif key == 'annoCorrente':
                value = str(value)
                
            # Cerca l'impostazione esistente
            setting = Impostazione.query.filter_by(chiave=key).first()
            
            if setting:
                # Aggiorna l'impostazione esistente
                setting.valore = value
            else:
                # Crea una nuova impostazione
                new_setting = Impostazione(chiave=key, valore=value)
                db.session.add(new_setting)
        
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500