from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime

# Importa moduli personalizzati
from database import init_db, db
from models import init_default_settings, Contatto
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
        
        try:
            # Query dal database direttamente
            query = Contatto.query.filter_by(tipo='clienti')
            
            # Filtro per eliminati
            if not include_eliminati:
                query = query.filter_by(eliminato=False)
                
            clienti = query.all()
            
            # Converti oggetti a dizionario
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
            print(f"Errore durante il caricamento dei clienti: {str(e)}")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/clienti', methods=['POST'])
    def save_clienti_no_prefix():
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
        
        try:
            # Query dal database direttamente
            query = Contatto.query.filter_by(tipo='partner')
            
            # Filtro per eliminati
            if not include_eliminati:
                query = query.filter_by(eliminato=False)
                
            partners = query.all()
            
            # Converti oggetti a dizionario
            partners_dict = []
            for p in partners:
                partner_dict = {}
                for column in p.__table__.columns:
                    value = getattr(p, column.name)
                    # Gestione di tipi di dati speciali
                    if isinstance(value, datetime):
                        partner_dict[column.name] = value.isoformat()
                    else:
                        partner_dict[column.name] = value
                partners_dict.append(partner_dict)
            
            return jsonify({
                'success': True,
                'data': partners_dict
            })
        except Exception as e:
            import traceback
            print(f"Errore durante il caricamento dei partner: {str(e)}")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/partner', methods=['POST'])
    def save_partner_no_prefix():
        data = request.json
        
        try:
            # Salva direttamente i nuovi partner nel database
            for item in data:
                if 'id' in item and item['id']:
                    # Cerca il partner esistente
                    partner = Contatto.query.get(item['id'])
                    if partner:
                        # Aggiorna i campi
                        for key, value in item.items():
                            if key != 'id' and hasattr(partner, key):
                                setattr(partner, key, value)
                        partner.lastUpdate = datetime.utcnow()
                    else:
                        # Crea un nuovo partner se non esiste
                        new_partner = Contatto(tipo='partner')
                        for key, value in item.items():
                            if hasattr(new_partner, key):
                                setattr(new_partner, key, value)
                        new_partner.createdAt = datetime.utcnow()
                        new_partner.lastUpdate = datetime.utcnow()
                        db.session.add(new_partner)
                else:
                    # Crea un nuovo partner senza ID
                    new_partner = Contatto(tipo='partner')
                    for key, value in item.items():
                        if hasattr(new_partner, key):
                            setattr(new_partner, key, value)
                    new_partner.createdAt = datetime.utcnow()
                    new_partner.lastUpdate = datetime.utcnow()
                    db.session.add(new_partner)
            
            # Salva le modifiche
            db.session.commit()
            
            # Carica i partner aggiornati
            partners = Contatto.query.filter_by(tipo='partner', eliminato=False).all()
            
            # Converti a dizionario manualmente per evitare errori con to_dict()
            partners_dict = []
            for p in partners:
                partner_dict = {}
                for column in p.__table__.columns:
                    value = getattr(p, column.name)
                    # Gestione di tipi di dati speciali
                    if isinstance(value, datetime):
                        partner_dict[column.name] = value.isoformat()
                    else:
                        partner_dict[column.name] = value
                partners_dict.append(partner_dict)
            
            return jsonify({
                'success': True,
                'data': partners_dict
            })
        except Exception as e:
            import traceback
            print(f"Errore durante il salvataggio dei partner: {str(e)}")
            print(traceback.format_exc())
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # Eliminati
    @app.route('/eliminati')
    def get_eliminati_no_prefix():
        try:
            eliminati = Contatto.query.filter_by(eliminato=True).all()
            
            # Converti a dizionario
            eliminati_dict = []
            for e in eliminati:
                item_dict = {}
                for column in e.__table__.columns:
                    value = getattr(e, column.name)
                    # Gestione di tipi di dati speciali
                    if isinstance(value, datetime):
                        item_dict[column.name] = value.isoformat()
                    else:
                        item_dict[column.name] = value
                eliminati_dict.append(item_dict)
            
            return jsonify({
                'success': True,
                'data': eliminati_dict
            })
        except Exception as e:
            import traceback
            print(f"Errore durante il caricamento degli eliminati: {str(e)}")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # Move to eliminati
    @app.route('/move-to-eliminati/<string:tipo>/<int:id>', methods=['POST'])
    def move_to_eliminati_no_prefix(tipo, id):
        try:
            contatto = Contatto.query.get(id)
            if not contatto:
                return jsonify({
                    'success': False,
                    'error': f'Contatto con ID {id} non trovato'
                }), 404
                
            # Segna il contatto come eliminato
            contatto.eliminato = True
            contatto.eliminatoIl = datetime.utcnow()
            db.session.commit()
            
            return jsonify({'success': True})
        except Exception as e:
            import traceback
            print(f"Errore durante lo spostamento negli eliminati: {str(e)}")
            print(traceback.format_exc())
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # Restore from eliminati
    @app.route('/restore-from-eliminati/<int:id>', methods=['POST'])
    def restore_from_eliminati_no_prefix(id):
        try:
            contatto = Contatto.query.get(id)
            if not contatto:
                return jsonify({
                    'success': False,
                    'error': f'Contatto con ID {id} non trovato'
                }), 404
                
            # Ripristina il contatto
            contatto.eliminato = False
            contatto.eliminatoIl = None
            db.session.commit()
            
            return jsonify({'success': True})
        except Exception as e:
            import traceback
            print(f"Errore durante il ripristino dagli eliminati: {str(e)}")
            print(traceback.format_exc())
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    # Bulk updates
    @app.route('/update-bulk/<string:tipo>', methods=['POST'])
    def update_bulk_no_prefix(tipo):
        data = request.json
        ids = data.get('ids', [])
        property_name = data.get('propertyName')
        property_value = data.get('propertyValue')
        
        if not ids or not property_name:
            return jsonify({
                'success': False,
                'error': 'Parametri mancanti (ids, propertyName, propertyValue)'
            }), 400
            
        try:
            # Ottieni tutti i contatti corrispondenti
            contatti = Contatto.query.filter(
                Contatto.id.in_(ids),
                Contatto.tipo == tipo
            ).all()
            
            for contatto in contatti:
                if hasattr(contatto, property_name):
                    # Gestione speciale per grappa e gls (possono essere "1", 1, o True)
                    if property_name in ['grappa', 'gls']:
                        setattr(contatto, property_name, property_value in [True, 1, '1'])
                    else:
                        setattr(contatto, property_name, property_value)
                    contatto.lastUpdate = datetime.utcnow()
            
            db.session.commit()
            
            # Carica i contatti aggiornati
            contatti_aggiornati = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
            
            # Converti a dizionario
            contatti_dict = []
            for c in contatti_aggiornati:
                contatto_dict = {}
                for column in c.__table__.columns:
                    value = getattr(c, column.name)
                    # Gestione di tipi di dati speciali
                    if isinstance(value, datetime):
                        contatto_dict[column.name] = value.isoformat()
                    else:
                        contatto_dict[column.name] = value
                contatti_dict.append(contatto_dict)
            
            return jsonify({
                'success': True,
                'data': contatti_dict
            })
        except Exception as e:
            import traceback
            print(f"Errore durante l'aggiornamento multiplo: {str(e)}")
            print(traceback.format_exc())
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
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