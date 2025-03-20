from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import numpy as np
import io
import openpyxl
from openpyxl.workbook import Workbook
from datetime import datetime
import json
import os
from models import Contatto, db
from werkzeug.utils import secure_filename

excel_bp = Blueprint('excel', __name__)

# Configurazione per l'upload di file
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../uploads')
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# Assicurati che la cartella per gli upload esista
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Controlla se l'estensione del file è consentita"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@excel_bp.route('/api/import-excel/<string:tipo>', methods=['POST'])
def import_excel(tipo):
    """Importa dati da un file Excel"""
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
        
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'message': 'Formato file non supportato. Utilizzare .xlsx o .xls'
        }), 400
    
    try:
        # Salva temporaneamente il file
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Determina quale foglio utilizzare
        xls = pd.ExcelFile(file_path)
        sheet_name = determine_sheet_name(xls.sheet_names, tipo)
        
        # Leggi il file Excel
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        # Normalizza i dati
        normalized_data = normalize_excel_data(df, tipo)
        
        # Rimuovi il file temporaneo
        os.remove(file_path)
        
        # Carica i dati esistenti
        existing_data = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
        existing_dict = {(c.nome.lower(), c.azienda.lower() if c.azienda else ''): c for c in existing_data if c.nome}
        
        # Elabora i dati importati
        new_records = 0
        updated_records = 0
        processed_records = []
        
        for item in normalized_data:
            nome = item.get('nome', '').strip()
            azienda = item.get('azienda', '').strip()
            
            if not nome and not azienda:
                continue
                
            key = (nome.lower(), azienda.lower())
            
            if key in existing_dict:
                # Aggiorna record esistente
                record = existing_dict[key]
                for field, value in item.items():
                    if field not in ['id', 'createdAt', 'eliminato', 'eliminatoIl']:
                        # Gestione speciale per campi booleani
                        if field in ['grappa', 'gls']:
                            setattr(record, field, value in [True, 1, '1'])
                        else:
                            setattr(record, field, value)
                record.lastUpdate = datetime.utcnow()
                updated_records += 1
                processed_records.append(record.to_dict())
            else:
                # Crea nuovo record
                record = Contatto(tipo=tipo)
                for field, value in item.items():
                    if field not in ['id', 'createdAt', 'eliminato', 'eliminatoIl']:
                        # Gestione speciale per campi booleani
                        if field in ['grappa', 'gls']:
                            setattr(record, field, value in [True, 1, '1'])
                        else:
                            setattr(record, field, value)
                record.createdAt = datetime.utcnow()
                record.lastUpdate = datetime.utcnow()
                db.session.add(record)
                new_records += 1
                
        # Salva le modifiche
        db.session.commit()
        
        # Ottieni dati aggiornati
        updated_data = Contatto.query.filter_by(tipo=tipo, eliminato=False).all()
        
        return jsonify({
            'success': True,
            'message': f'Importazione completata: {new_records} nuovi record, {updated_records} record aggiornati',
            'data': [item.to_dict() for item in updated_data]
        })
        
    except Exception as e:
        db.session.rollback()
        # Assicurati che il file temporaneo venga eliminato anche in caso di errore
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({
            'success': False,
            'message': f'Errore durante l\'importazione: {str(e)}'
        }), 500

@excel_bp.route('/api/export-gls', methods=['GET'])
def export_gls():
    """Esporta i dati per GLS"""
    try:
        # Ottieni tutti i record con GLS=True
        clienti = Contatto.query.filter_by(tipo='clienti', gls=True, eliminato=False).all()
        partner = Contatto.query.filter_by(tipo='partner', gls=True, eliminato=False).all()
        
        # Unisci i dati
        all_records = clienti + partner
        
        if not all_records:
            return jsonify({
                'success': False,
                'message': 'Nessun record da esportare per GLS'
            }), 404
            
        # Crea DataFrame per l'export
        gls_data = []
        for record in all_records:
            # Determina il nome del destinatario (priorità all'azienda)
            nome_destinatario = record.azienda if record.azienda else record.nome
            
            # Combina indirizzo e civico
            indirizzo = f"{record.indirizzo or ''} {record.civico or ''}".strip()
            
            gls_data.append({
                'NOME DESTINATARIO': nome_destinatario,
                'INDIRIZZO': indirizzo,
                'LOCALITA\'': record.localita or '',
                'PROV': record.provincia or '',
                'CAP': record.cap or '',
                'TIPO MERCE': 'OMAGGIO NATALIZIO',
                'COLLI': '1',
                'NOTE SPEDIZIONE': record.note or '',
                'RIFERIMENTO MITTENTE': record.nome or '',
                'TELEFONO': record.telefono or ''
            })
            
        # Crea Excel in memoria
        output = io.BytesIO()
        
        df = pd.DataFrame(gls_data)
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Spedizioni GLS', index=False)
            
            # Imposta la larghezza delle colonne
            worksheet = writer.sheets['Spedizioni GLS']
            col_widths = {
                'A': 30,  # NOME DESTINATARIO
                'B': 40,  # INDIRIZZO
                'C': 20,  # LOCALITA
                'D': 5,   # PROV
                'E': 10,  # CAP
                'F': 20,  # TIPO MERCE
                'G': 5,   # COLLI
                'H': 30,  # NOTE SPEDIZIONE
                'I': 25,  # RIFERIMENTO MITTENTE
                'J': 15   # TELEFONO
            }
            
            for col, width in col_widths.items():
                worksheet.column_dimensions[col].width = width
        
        # Reimposta il puntatore all'inizio del file
        output.seek(0)
        
        # Restituisci il file
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='Spedizioni_GLS.xlsx'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Errore durante l\'esportazione: {str(e)}'
        }), 500

def determine_sheet_name(sheet_names, tipo):
    """Determina quale foglio utilizzare in base al tipo di dati"""
    # Array di possibili nomi di foglio in ordine di priorità
    possible_names = [
        tipo.capitalize(),  # "Clienti" o "Partner"
        tipo,               # "clienti" o "partner" 
        tipo + 'i',         # "clienti" se tipo = "client"
        tipo.capitalize()[:-1] + 'i'  # "Clienti" se tipo = "client"
    ]
    
    # Cerca un foglio con nome corrispondente
    for name in possible_names:
        if name in sheet_names:
            return name
            
    # Cerca nomi che contengono il tipo
    for sheet_name in sheet_names:
        if tipo.lower() in sheet_name.lower():
            return sheet_name
            
    # Se non trova corrispondenze, usa il primo foglio
    return sheet_names[0]

def normalize_excel_data(df, tipo):
    """Normalizza i dati del DataFrame"""
    # Converti NaN a stringhe vuote
    df = df.replace({np.nan: ''})
    
    # Converti DataFrame in lista di dizionari
    data = df.to_dict('records')
    normalized_data = []
    
    # Definisci mappatura delle colonne
    key_mapping = {
        'nome': ['nome', 'nome persona', 'nominativo', 'nome_persona', 'nome cliente', 'nome e cognome', 'persona', 'referente', 'nome referente', 'cliente'],
        'azienda': ['azienda', 'nome azienda', 'società', 'ragione sociale', 'company', 'ditta', 'società cliente', 'societa', 'nome societa', 'società'],
        'indirizzo': ['indirizzo', 'via', 'strada', 'address', 'via/piazza', 'indirizzo stradale', 'via piazza', 'indirizzo spedizione'],
        'civico': ['civico', 'numero civico', 'n. civico', 'n.civico', 'n°', 'numero', 'numero indirizzo', 'n. civico', 'num', 'num.'],
        'cap': ['cap', 'codice postale', 'postal code', 'zip', 'codice avviamento postale', 'c.a.p.', 'c.a.p'],
        'localita': ['localita', 'località', 'comune', 'città', 'city', 'paese', 'town', 'citta', 'loc', 'loc.'],
        'provincia': ['provincia', 'prov', 'province', 'pr', 'pr.', 'sigla provincia', 'prov.', 'provincia sigla'],
        'telefono': ['telefono', 'tel', 'phone', 'cellulare', 'tel.', 'numero telefono', 'cell', 'numero cellulare', 'tel/cell', 'cell.'],
        'email': ['email', 'e-mail', 'mail', 'posta elettronica', 'indirizzo email', 'e mail', 'posta'],
        'note': ['note', 'annotazioni', 'commenti', 'notes', 'note aggiuntive', 'note cliente', 'commento'],
        'tipologia': ['tipologia', 'tipo partner', 'categoria', 'tipo cliente', 'tipo', 'category', 'gruppo'],
        'grappa': ['grappa', 'regalo grappa', 'omaggio grappa', 'regalo', 'gift', 'presente', 'omaggio', 'dono'],
        'extraAltro': ['extra/altro', 'extra', 'altro regalo', 'altro omaggio', 'extra regalo', 'regalo extra', 'altro', 'altri regali', 'extra/altri'],
        'consegnaSpedizione': ['consegna/spedizione', 'consegna', 'consegna a mano', 'incaricato consegna', 'consegnatario', 'deliverer', 'spedizione', 'incaricato', 'consegna spedizione'],
        'gls': ['gls', 'spedizione gls', 'corriere', 'spedizione', 'shipping', 'courier', 'corriere gls']
    }
    
    for row in data:
        normalized_row = {
            'tipo': tipo
        }
        
        # Verifica se le chiavi hanno nomi Excel generici (A, B, C, ecc.)
        has_generic_columns = any(key for key in row.keys() if isinstance(key, str) and key.upper() == key and len(key) <= 2)
        
        if has_generic_columns:
            # Mappatura diretta basata sulla posizione
            column_order = ['nome', 'azienda', 'indirizzo', 'civico', 'cap', 'localita', 'provincia', 
                          'telefono', 'email', 'note', 'grappa', 'extraAltro', 'consegnaSpedizione', 'gls']
            
            # Associa le colonne in ordine
            col_index = 0
            for key in sorted(row.keys()):
                if isinstance(key, str) and key.upper() == key and len(key) <= 2 and col_index < len(column_order):
                    value = row[key]
                    if value != '':
                        normalized_row[column_order[col_index]] = normalize_value(column_order[col_index], value)
                    col_index += 1
        else:
            # Per tutte le altre colonne, analizza ogni campo
            for original_key, value in row.items():
                if value == '':
                    continue
                    
                # Normalizza la chiave (minuscolo, senza spazi o caratteri speciali)
                normalized_key = str(original_key).lower().strip().replace('/', ' ').replace('-', ' ').replace('_', ' ').replace('.', ' ')
                normalized_key = ' '.join(normalized_key.split())
                
                # Trova la chiave normalizzata
                mapped_key = None
                
                # Cerca corrispondenza esatta
                for key, possible_keys in key_mapping.items():
                    if normalized_key in possible_keys:
                        mapped_key = key
                        break
                
                # Se non c'è corrispondenza esatta, cerca corrispondenze parziali
                if not mapped_key:
                    for key, possible_keys in key_mapping.items():
                        for possible_key in possible_keys:
                            if possible_key in normalized_key or normalized_key in possible_key:
                                mapped_key = key
                                break
                        if mapped_key:
                            break
                
                # Usa la chiave mappata o una versione semplificata della chiave originale
                final_key = mapped_key or normalized_key.replace(' ', '_')
                normalized_row[final_key] = normalize_value(final_key, value)
        
        # Aggiungi la riga normalizzata solo se ha campi sufficienti
        if 'nome' in normalized_row or 'azienda' in normalized_row:
            non_empty_fields = sum(1 for v in normalized_row.values() if v)
            if non_empty_fields >= 3:
                normalized_data.append(normalized_row)
                
    return normalized_data

def normalize_value(field_name, value):
    """Normalizza un valore in base al tipo di campo"""
    # Gestione per campi booleani (grappa, gls)
    if field_name in ['grappa', 'gls']:
        return normalize_boolean(value)
    
    # Se è una data, converti in stringa ISO
    if isinstance(value, datetime):
        return value.isoformat()
    
    # Per altri campi, assicurati che il valore sia una stringa
    return str(value).strip()

def normalize_boolean(value):
    """Normalizza i valori booleani da vari formati"""
    if isinstance(value, bool):
        return '1' if value else ''
    
    if isinstance(value, (int, float)):
        return '1' if value == 1 else ''
    
    if isinstance(value, str):
        value = value.lower().strip()
        if value in ['1', 'true', 'yes', 'sì', 'si', 'vero', 'x', '✓', '✔', '√']:
            return '1'
    
    return ''