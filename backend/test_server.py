from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Stato in memoria (si resetterà ad ogni riavvio del server)
clienti_data = []
partner_data = []
eliminati_data = []
next_id = 1000  # ID iniziale per nuovi elementi

# Crea una cartella di upload se non esiste
os.makedirs('uploads', exist_ok=True)

@app.route('/api/status')
def status():
    return jsonify({
        'status': 'online',
        'version': '1.0.0'
    })

@app.route('/api/settings')
def settings():
    return jsonify({
        'success': True,
        'data': {
            'regaloCorrente': 'Grappa',
            'annoCorrente': 2024,
            'consegnatari': ['Andrea Gosgnach', 'Marco Crasnich', 'Massimo Cendron', 'Matteo Rocchetto']
        }
    })

@app.route('/api/clienti')
def get_clienti():
    include_eliminati = request.args.get('include_eliminati', 'false').lower() == 'true'
    filtered = [c for c in clienti_data if include_eliminati or not c.get('eliminato', False)]
    return jsonify({
        'success': True,
        'data': filtered
    })

@app.route('/api/clienti', methods=['POST'])
def save_clienti():
    global clienti_data
    data = request.json
    
    # Salva i dati inviati dal frontend
    clienti_data = data
    
    # Risponde con i dati aggiornati
    return jsonify({
        'success': True,
        'data': clienti_data
    })

@app.route('/api/partner')
def get_partner():
    include_eliminati = request.args.get('include_eliminati', 'false').lower() == 'true'
    filtered = [p for p in partner_data if include_eliminati or not p.get('eliminato', False)]
    return jsonify({
        'success': True,
        'data': filtered
    })

@app.route('/api/partner', methods=['POST'])
def save_partner():
    global partner_data
    data = request.json
    
    # Salva i dati inviati dal frontend
    partner_data = data
    
    # Risponde con i dati aggiornati
    return jsonify({
        'success': True,
        'data': partner_data
    })

@app.route('/api/eliminati')
def get_eliminati():
    return jsonify({
        'success': True,
        'data': eliminati_data
    })

# Aggiungi endpoint per l'importazione Excel
@app.route('/api/import-excel/<string:tipo>', methods=['POST'])
def import_excel(tipo):
    global clienti_data, partner_data, next_id
    
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'Nessun file caricato'
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'Nessun file selezionato'
        }), 400
    
    # Salva il file temporaneamente
    file_path = os.path.join('uploads', file.filename)
    file.save(file_path)
    
    # Crea dati di esempio per simulare un'importazione
    sample_data = []
    for i in range(5):  # Simula 5 record
        next_id += 1
        sample_data.append({
            'id': next_id,
            'nome': f'Cliente Test {next_id}',
            'azienda': f'Azienda Test {next_id}',
            'indirizzo': f'Via Test {next_id}',
            'civico': str(i+1),
            'cap': '12345',
            'localita': 'Località Test',
            'provincia': 'TS',
            'telefono': '123456789',
            'email': f'test{next_id}@example.com',
            'note': '',
            'grappa': i % 2 == 0,  # Alternati vero/falso
            'extraAltro': '',
            'consegnaSpedizione': '',
            'gls': i % 3 == 0,  # Ogni terzo record
            'eliminato': False,
            'tipo': tipo,
            'createdAt': int(datetime.now().timestamp() * 1000)
        })
    
    # Aggiorna lo stato in base al tipo
    if tipo == 'clienti':
        clienti_data = sample_data
    elif tipo == 'partner':
        partner_data = sample_data
    
    return jsonify({
        'success': True,
        'message': f'Importati {len(sample_data)} {tipo}',
        'data': sample_data
    })

# Endpoint per esportazione GLS
@app.route('/api/export-gls', methods=['GET'])
def export_gls():
    return jsonify({
        'success': True,
        'message': 'Esportazione completata con successo (simulazione)'
    })

# Endpoint per aggiornamenti di gruppo
@app.route('/api/update-bulk/<string:tipo>', methods=['POST'])
def update_bulk(tipo):
    global clienti_data, partner_data
    
    data = request.json
    ids = data.get('ids', [])
    property_name = data.get('propertyName')
    property_value = data.get('propertyValue')
    
    if tipo == 'clienti':
        target_data = clienti_data
    else:
        target_data = partner_data
    
    # Aggiorna gli elementi selezionati
    for item in target_data:
        if item.get('id') in ids:
            item[property_name] = property_value
    
    return jsonify({
        'success': True,
        'message': f'Aggiornati {len(ids)} {tipo}',
        'data': target_data
    })

# Endpoint per spostare negli eliminati
@app.route('/api/move-to-eliminati/<string:tipo>/<int:id>', methods=['POST'])
def move_to_eliminati(tipo, id):
    global clienti_data, partner_data, eliminati_data
    
    # Trova l'elemento da spostare
    if tipo == 'clienti':
        target_data = clienti_data
    else:
        target_data = partner_data
    
    for i, item in enumerate(target_data):
        if item.get('id') == id:
            # Segna come eliminato
            item['eliminato'] = True
            item['eliminatoIl'] = int(datetime.now().timestamp() * 1000)
            
            # Aggiungi alla lista degli eliminati
            eliminati_data.append(item)
            
            # Rimuovi dalla lista originale
            del target_data[i]
            break
    
    return jsonify({
        'success': True
    })

# Endpoint per ripristinare dagli eliminati
@app.route('/api/restore-from-eliminati/<int:id>', methods=['POST'])
def restore_from_eliminati(id):
    global clienti_data, partner_data, eliminati_data
    
    for i, item in enumerate(eliminati_data):
        if item.get('id') == id:
            # Ripristina l'elemento
            item['eliminato'] = False
            item['eliminatoIl'] = None
            
            # Aggiungi alla lista appropriata
            if item.get('tipo') == 'clienti':
                clienti_data.append(item)
            else:
                partner_data.append(item)
            
            # Rimuovi dalla lista degli eliminati
            del eliminati_data[i]
            break
    
    return jsonify({
        'success': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)