from flask import Flask, request, jsonify
import urllib.request
import urllib.parse
import json

app = Flask(__name__)

@app.route('/api/history', methods=['GET'])
def history():
    symbol = request.args.get('symbol', '')
    range_val = request.args.get('range', '1d')
    
    if not symbol:
        return jsonify({"error": "Symbol required"}), 400
    
    # Map range to interval
    interval_map = {
        '1d': '5m', '5d': '15m', '1mo': '1h', '1y': '1d'
    }
    interval = interval_map.get(range_val, '5m')
    
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?interval={interval}&range={range_val}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
        
        result = data.get('chart', {}).get('result', [])
        if not result:
            raise Exception("No data returned")
        
        timestamps = result[0].get('timestamp', [])
        closes = result[0].get('indicators', {}).get('quote', [{}])[0].get('close', [])
        
        history_data = [
            {"time": t, "price": p}
            for t, p in zip(timestamps, closes) if p is not None
        ]
        
        return jsonify(history_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
