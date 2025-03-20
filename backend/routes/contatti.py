from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from datetime import datetime
from models import Contatto, db

contatti_bp = Blueprint('contatti', __name__)

# Carica contatti (clienti o partner)
@contatti_bp.route('/api/<string:tipo>', methods=['GET'])
def get_contatti(tipo):
    """Recupera i contatti in base al tipo (clienti o partner)"""
    include_eliminati = request.args.get('include_eliminati', 'false').lower() == 'true'
    
    # Query di base
    query = Contatto.query.filter_by(tipo=tipo)
    
    # Filtra eliminati se richiesto
    if not include_eliminati:
        query = query.filter_by(eliminato=False)
        
    contatti = query.all()
    return jsonify({
        'success': True,
        'data': [contatto.to_dict() for contatto in contatti]
    })

# Salva contatti (clienti o partner)
@contatti_bp.route('/api/<string:tipo>', methods=['POST'])
def save_contatti(tipo):
    """Salva l'elenco completo di contatti"""
    data = request.json
    
    try:
        # Rimuovi tutti i contatti esistenti non eliminati di questo tipo
        existing = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
        existing_ids = {contatto.id for contatto in existing}
        
        # IDs nei nuovi dati
        new_ids = {item.get('id') for item in data if item.get('id')}
        
        # Identifica record da eliminare (quelli che esistono ma non sono nei nuovi dati)
        to_delete_ids = existing_ids - new_ids
        
        # Segna come eliminati i record che non sono più nell'elenco
        for id in to_delete_ids:
            contatto = Contatto.query.get(id)
            if contatto:
                contatto.eliminato = True
                contatto.eliminatoIl = datetime.utcnow()
                
        # Aggiorna o crea nuovi record
        for item in data:
            # Verifica se l'ID esiste
            if item.get('id'):
                contatto = Contatto.query.get(item['id'])
                if contatto:
                    # Aggiorna record esistente
                    for key, value in item.items():
                        if key != 'id' and hasattr(contatto, key):
                            # Gestione speciale per grappa e gls (possono essere "1", 1, o True)
                            if key in ['grappa', 'gls']:
                                setattr(contatto, key, value in [True, 1, '1'])
                            else:
                                setattr(contatto, key, value)
                    contatto.lastUpdate = datetime.utcnow()
                else:
                    # Crea nuovo contatto con ID specifico
                    create_contatto(item, tipo)
            else:
                # Crea nuovo contatto senza ID
                create_contatto(item, tipo)
        
        db.session.commit()
        
        # Restituisci l'elenco aggiornato
        contatti = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
        return jsonify({
            'success': True,
            'data': [contatto.to_dict() for contatto in contatti]
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Sposta un contatto negli eliminati
@contatti_bp.route('/api/move-to-eliminati/<string:tipo>/<int:id>', methods=['POST'])
def move_to_eliminati(tipo, id):
    """Segna un contatto come eliminato"""
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
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Ripristina un contatto dagli eliminati
@contatti_bp.route('/api/restore-from-eliminati/<int:id>', methods=['POST'])
def restore_from_eliminati(id):
    """Ripristina un contatto dagli eliminati"""
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
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Aggiorna in modo massivo i contatti
@contatti_bp.route('/api/update-bulk/<string:tipo>', methods=['POST'])
def update_bulk(tipo):
    """Aggiorna più contatti con lo stesso valore per una proprietà"""
    data = request.json
    ids = data.get('ids', [])
    propertyName = data.get('propertyName')
    propertyValue = data.get('propertyValue')
    
    if not ids or not propertyName:
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
            if hasattr(contatto, propertyName):
                # Gestione speciale per grappa e gls (possono essere "1", 1, o True)
                if propertyName in ['grappa', 'gls']:
                    setattr(contatto, propertyName, propertyValue in [True, 1, '1'])
                else:
                    setattr(contatto, propertyName, propertyValue)
                contatto.lastUpdate = datetime.utcnow()
        
        db.session.commit()
        
        # Restituisci l'elenco aggiornato
        contatti_aggiornati = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
        return jsonify({
            'success': True,
            'data': [contatto.to_dict() for contatto in contatti_aggiornati]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Ottieni l'elenco degli eliminati
@contatti_bp.route('/api/eliminati', methods=['GET'])
def get_eliminati():
    """Recupera tutti i contatti eliminati"""
    contatti = Contatto.query.filter_by(eliminato=True).all()
    return jsonify({
        'success': True,
        'data': [contatto.to_dict() for contatto in contatti]
    })

# Svuota il cestino (elimina definitivamente)
@contatti_bp.route('/api/eliminati', methods=['DELETE'])
def empty_trash():
    """Elimina definitivamente tutti i contatti nel cestino"""
    try:
        Contatto.query.filter_by(eliminato=True).delete()
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Elimina definitivamente un singolo contatto
@contatti_bp.route('/api/eliminati/<int:id>', methods=['DELETE'])
def delete_permanently(id):
    """Elimina definitivamente un contatto specifico"""
    try:
        contatto = Contatto.query.get(id)
        if not contatto:
            return jsonify({
                'success': False,
                'error': f'Contatto con ID {id} non trovato'
            }), 404
            
        db.session.delete(contatto)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Funzione di utilità per creare un contatto
def create_contatto(data, tipo):
    """Crea un nuovo contatto dal dizionario di dati"""
    contatto = Contatto(tipo=tipo)
    
    # Imposta gli attributi dal dizionario
    for key, value in data.items():
        if hasattr(contatto, key):
            # Gestione speciale per grappa e gls (possono essere "1", 1, o True)
            if key in ['grappa', 'gls']:
                setattr(contatto, key, value in [True, 1, '1'])
            else:
                setattr(contatto, key, value)
    
    # Imposta timestamp di creazione
    contatto.createdAt = datetime.utcnow()
    contatto.lastUpdate = datetime.utcnow()
    
    db.session.add(contatto)
    return contatto