from flask import Flask, request, jsonify
import urllib.request
import urllib.parse
import json

app = Flask(__name__)

@app.route('/api/quote', methods=['GET'])
def quote():
    symbol = request.args.get('symbol', '')
    
    if not symbol:
        return jsonify({"error": "Symbol required"}), 400
    
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?interval=1m&range=1d"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
        
        result = data.get('chart', {}).get('result', [])
        if not result:
            raise Exception("No data returned")
        
        meta = result[0].get('meta', {})
        quote_data = {
            "symbol": symbol,
            "price": meta.get('regularMarketPrice', 0),
            "changePct": ((meta.get('regularMarketPrice', 0) - meta.get('previousClose', 1)) / meta.get('previousClose', 1)) * 100,
            "high": meta.get('regularMarketDayHigh', 0),
            "low": meta.get('regularMarketDayLow', 0),
            "open": meta.get('regularMarketOpen', 0),
            "prevClose": meta.get('previousClose', 0),
            "volume": meta.get('regularMarketVolume', 0)
        }
        
        return jsonify(quote_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
