from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Importa moduli personalizzati
from database import init_db, db
from models import init_default_settings
from routes.contatti import contatti_bp
from routes.impostazioni import impostazioni_bp

# Tenta di importare il modulo excel, ma continua anche se fallisce
try:
    from routes.excel import excel_bp
    has_excel_support = True
except ImportError:
    has_excel_support = False
    # Crea un blueprint vuoto per evitare errori
    from flask import Blueprint
    excel_bp = Blueprint('excel', __name__)
    print("AVVISO: Supporto Excel disabilitato a causa di errori di importazione")

# Carica variabili d'ambiente
load_dotenv()

def create_app():
    """Factory per la creazione dell'app Flask"""
    app = Flask(__name__, static_folder='../frontend/build')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Max 16 MB per upload
    
    # Configura CORS
    CORS(app)
    
    # Inizializza database
    init_db(app)
    
    # Registra le blueprints
    app.register_blueprint(contatti_bp)
    app.register_blueprint(impostazioni_bp)
    
    # Registra excel_bp solo se il supporto è disponibile
    if has_excel_support:
        app.register_blueprint(excel_bp)
    else:
        # Crea endpoint fallback per Excel se non è disponibile il supporto
        @app.route('/api/import-excel/<string:tipo>', methods=['POST'])
        def import_excel_fallback(tipo):
            return jsonify({
                'success': False,
                'message': 'Funzionalità di importazione Excel non disponibile su questo server',
                'data': []
            }), 503
        
        @app.route('/api/export-gls', methods=['GET'])
        def export_gls_fallback():
            return jsonify({
                'success': False,
                'message': 'Funzionalità di esportazione GLS non disponibile su questo server'
            }), 503
    
    # Route per servire l'app React
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(app.static_folder + '/' + path):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    
    # Route per verificare lo stato dell'API
    @app.route('/api/status')
    def status():
        return jsonify({
            'status': 'online',
            'version': '1.0.0',
            'excel_support': has_excel_support
        })
    
    # Versione senza prefisso /api
    @app.route('/status')
    def status_no_prefix():
        return status()
        
    # Handler per errori 404
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'success': False,
            'error': 'Risorsa non trovata'
        }), 404
        
    # Handler per errori 500
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({
            'success': False,
            'error': 'Errore del server'
        }), 500
    
    # Rotte senza prefisso /api per compatibilità col frontend
    
    # Settings
    @app.route('/settings')
    def get_settings_no_prefix():
        from routes.impostazioni import get_settings
        return get_settings()
    
    # Clienti
    @app.route('/clienti')
    def get_clienti_no_prefix():
        include_eliminati = request.args.get('include_eliminati', 'false').lower() == 'true'
        from routes.contatti import get_contatti
        return get_contatti('clienti')
    
    @app.route('/clienti', methods=['POST'])
    def save_clienti_no_prefix():
    from models import Contatto, db
    from datetime import datetime
    data = request.json
    
    try:
        # Salva direttamente i nuovi clienti nel database
        for item in data:
            if 'id' in item and item['id']:
                # Cerca il cliente esistente
                cliente = Contatto.query.get(item['id'])
                if cliente:
                    # Aggiorna i campi
                    for key, value in item.items():
                        if key != 'id' and hasattr(cliente, key):
                            setattr(cliente, key, value)
                    cliente.lastUpdate = datetime.utcnow()
                else:
                    # Crea un nuovo cliente se non esiste
                    new_cliente = Contatto(tipo='clienti')
                    for key, value in item.items():
                        if hasattr(new_cliente, key):
                            setattr(new_cliente, key, value)
                    new_cliente.createdAt = datetime.utcnow()
                    new_cliente.lastUpdate = datetime.utcnow()
                    db.session.add(new_cliente)
            else:
                # Crea un nuovo cliente senza ID
                new_cliente = Contatto(tipo='clienti')
                for key, value in item.items():
                    if hasattr(new_cliente, key):
                        setattr(new_cliente, key, value)
                new_cliente.createdAt = datetime.utcnow()
                new_cliente.lastUpdate = datetime.utcnow()
                db.session.add(new_cliente)
        
        # Salva le modifiche
        db.session.commit()
        
        # Carica i clienti aggiornati
        clienti = Contatto.query.filter_by(tipo='clienti', eliminato=False).all()
        
        # Converti a dizionario manualmente per evitare errori con to_dict()
        clienti_dict = []
        for c in clienti:
            cliente_dict = {}
            for column in c.__table__.columns:
                value = getattr(c, column.name)
                # Gestione di tipi di dati speciali
                if isinstance(value, datetime):
                    cliente_dict[column.name] = value.isoformat()
                else:
                    cliente_dict[column.name] = value
            clienti_dict.append(cliente_dict)
        
        return jsonify({
            'success': True,
            'data': clienti_dict
        })
    except Exception as e:
        import traceback
        print(f"Errore durante il salvataggio dei clienti: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    # Partner
    @app.route('/partner')
    def get_partner_no_prefix():
        include_eliminati = request.args.get('include_eliminati', 'false').lower() == 'true'
        from routes.contatti import get_contatti
        return get_contatti('partner')
    
    @app.route('/partner', methods=['POST'])
    def save_partner_no_prefix():
        from routes.contatti import save_contatti
        return save_contatti('partner')
    
    # Eliminati
    @app.route('/eliminati')
    def get_eliminati_no_prefix():
        from routes.contatti import get_eliminati
        return get_eliminati()
    
    # Move to eliminati
    @app.route('/move-to-eliminati/<string:tipo>/<int:id>', methods=['POST'])
    def move_to_eliminati_no_prefix(tipo, id):
        from routes.contatti import move_to_eliminati
        return move_to_eliminati(tipo, id)
    
    # Restore from eliminati
    @app.route('/restore-from-eliminati/<int:id>', methods=['POST'])
    def restore_from_eliminati_no_prefix(id):
        from routes.contatti import restore_from_eliminati
        return restore_from_eliminati(id)
    
    # Bulk updates
    @app.route('/update-bulk/<string:tipo>', methods=['POST'])
    def update_bulk_no_prefix(tipo):
        from routes.contatti import update_bulk
        return update_bulk(tipo)
    
    # Excel import fallback
    if not has_excel_support:
        @app.route('/import-excel/<string:tipo>', methods=['POST'])
        def import_excel_fallback_no_prefix(tipo):
            return jsonify({
                'success': False,
                'message': 'Funzionalità di importazione Excel non disponibile su questo server',
                'data': []
            }), 503
        
        @app.route('/export-gls', methods=['GET'])
        def export_gls_fallback_no_prefix():
            return jsonify({
                'success': False,
                'message': 'Funzionalità di esportazione GLS non disponibile su questo server'
            }), 503
    
    # Inizializza impostazioni predefinite
    with app.app_context():
        init_default_settings()
    
    return app

if __name__ == '__main__':
    # Ottieni la porta dal file .env o usa 5000 come default
    port = int(os.environ.get('PORT', 5000))
    
    # Crea e avvia l'app
    app = create_app()
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true')
