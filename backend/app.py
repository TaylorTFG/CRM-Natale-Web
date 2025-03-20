from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Importa moduli personalizzati
from database import init_db, db
from models import init_default_settings
from routes.contatti import contatti_bp
from routes.impostazioni import impostazioni_bp
from routes.excel import excel_bp

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
    app.register_blueprint(excel_bp)
    
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
            'version': '1.0.0'
        })
        
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
    
    # Inizializza impostazioni predefinite
    with app.app_context():
        init_default_settings()
    
    return app

if __name__ == '__main__':
    # Ottieni la porta dal file .env o usa 5000 come default
    port = int(os.environ.get('PORT', 5000))
    
    # Crea e avvia l'app
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true')