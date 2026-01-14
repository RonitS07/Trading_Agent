from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        symbol = params.get('symbol', [''])[0]
        range_val = params.get('range', ['1d'])[0]
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if not symbol:
            self.wfile.write(json.dumps({"error": "Symbol required"}).encode())
            return
        
        interval_map = {'1d': '5m', '5d': '15m', '1mo': '1h', '1y': '1d'}
        interval = interval_map.get(range_val, '5m')
        
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?interval={interval}&range={range_val}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
            
            result = data.get('chart', {}).get('result', [])
            if not result:
                raise Exception("No data")
            
            timestamps = result[0].get('timestamp', [])
            closes = result[0].get('indicators', {}).get('quote', [{}])[0].get('close', [])
            
            history = [{"time": t, "price": p} for t, p in zip(timestamps, closes) if p is not None]
            
            self.wfile.write(json.dumps(history).encode())
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode())

