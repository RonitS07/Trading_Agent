from flask import Flask, request, jsonify
import urllib.request
import urllib.parse
import json

app = Flask(__name__)

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    
    if not query or len(query) < 2:
        return jsonify([])
    
    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(query)}&quotesCount=10&newsCount=0"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            
        quotes = data.get('quotes', [])
        # Filter for Indian market symbols (NSE/BSE)
        filtered = [
            {"symbol": q.get('symbol'), "shortname": q.get('shortname', q.get('longname', '')), "exchange": q.get('exchange', '')}
            for q in quotes
            if q.get('exchange') in ['NSI', 'BSE', 'NSE'] or '.NS' in q.get('symbol', '') or '.BO' in q.get('symbol', '')
        ]
        
        return jsonify(filtered)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
