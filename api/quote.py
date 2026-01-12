from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        symbol = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('symbol', [''])[0]
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if not symbol:
            self.wfile.write(json.dumps({"error": "Symbol required"}).encode())
            return
        
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?interval=1m&range=1d"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
            
            result = data.get('chart', {}).get('result', [])
            if not result:
                raise Exception("No data")
            
            meta = result[0].get('meta', {})
            prev = meta.get('previousClose', 1)
            price = meta.get('regularMarketPrice', 0)
            
            quote_data = {
                "symbol": symbol,
                "price": price,
                "changePct": ((price - prev) / prev) * 100 if prev else 0,
                "high": meta.get('regularMarketDayHigh', 0),
                "low": meta.get('regularMarketDayLow', 0),
                "open": meta.get('regularMarketOpen', 0),
                "prevClose": prev,
                "volume": meta.get('regularMarketVolume', 0)
            }
            
            self.wfile.write(json.dumps(quote_data).encode())
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode())
