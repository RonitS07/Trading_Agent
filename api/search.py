from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('q', [''])[0]
        
        if not query or len(query) < 2:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps([]).encode())
            return
        
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
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(filtered).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
