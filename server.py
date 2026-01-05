import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import ssl

PORT = 8008

class YahooProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse URL
        parsed_path = urllib.parse.urlparse(self.path)
        
        # API Route: /api/quote?symbol=...
        if parsed_path.path == '/api/quote':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            symbol = query_params.get('symbol', [None])[0]
            
            if not symbol:
                self.send_error(400, "Missing symbol parameter")
                return

            try:
                # Yahoo Finance Chart API (Standard, unspoken public endpoint)
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d"
                
                # Create Request (User-Agent header is often needed)
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                
                # Fetch Data (Standard Library, No Pip)
                context = ssl._create_unverified_context()
                with urllib.request.urlopen(req, context=context) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    
                # Extract Key Metrics
                result = data['chart']['result'][0]
                meta = result['meta']
                
                price = meta.get('regularMarketPrice')
                prev_close = meta.get('chartPreviousClose')
                currency = meta.get('currency')
                
                if price is None:
                    raise ValueError("No price data found")

                change = price - prev_close
                change_pct = (change / prev_close) * 100
                
                response_data = {
                    "symbol": symbol.upper(),
                    "price": price,
                    "change": round(change, 2),
                    "changePct": round(change_pct, 2),
                    "currency": currency
                }

                # Send JSON Response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_msg = {"error": str(e), "note": "Symbol might be invalid or Yahoo API changed"}
                self.wfile.write(json.dumps(error_msg).encode('utf-8'))
                

        # API Route: /api/search?q=...
        elif parsed_path.path == '/api/search':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            q = query_params.get('q', [None])[0]
            
            if not q:
                self.send_error(400, "Missing query parameter 'q'")
                return

            try:
                # Yahoo Finance Search API
                url = f"https://query1.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(q)}&quotesCount=6&newsCount=0"
                
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                
                context = ssl._create_unverified_context()
                with urllib.request.urlopen(req, context=context) as response:
                    data = json.loads(response.read().decode('utf-8'))
                
                # Extract simply quotes
                quotes = data.get('quotes', [])
                results = []
                for quote in quotes:
                    exch = quote.get('exchange', '')
                    sym = quote.get('symbol', '')
                    
                    # STRICT FILTER: Indian Markets Only (NSE/BSE)
                    if exch in ['NSI', 'BSE', 'NSE', 'BOM'] or sym.endswith('.NS') or sym.endswith('.BO'):
                        results.append({
                            "symbol": sym,
                            "shortname": quote.get('shortname', quote.get('longname', sym)),
                            "exchange": exch,
                            "type": quote.get('quoteType', '')
                        })

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(results).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        # API Route: /api/history?symbol=...&range=...
        elif parsed_path.path == '/api/history':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            symbol = query_params.get('symbol', [None])[0]
            rng = query_params.get('range', ['1d'])[0] # 1d, 5d, 1mo, 1y

            if not symbol:
                self.send_error(400, "Missing symbol parameter")
                return

            # Map range to intervals
            intervals = {'1d': '5m', '5d': '30m', '1mo': '1d', '1y': '1wk'}
            interval = intervals.get(rng, '1d')

            try:
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={rng}&interval={interval}"
                
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                context = ssl._create_unverified_context()
                with urllib.request.urlopen(req, context=context) as response:
                    data = json.loads(response.read().decode('utf-8'))
                
                result = data['chart']['result'][0]
                timestamps = result.get('timestamp', [])
                prices = result['indicators']['quote'][0].get('close', [])
                
                # Cleanup nulls (occasionally Yahoo has gaps)
                valid_data = []
                for t, p in zip(timestamps, prices):
                    if p is not None:
                        valid_data.append({"time": t, "price": round(p, 2)})

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(valid_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        else:
            # Default behavior: serve static files (index.html, etc.)
            super().do_GET()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

print(f"Starting Trading Agent Server on port {PORT}...")
print("Backend Ready: Proxying Yahoo Finance Data")
with ThreadedTCPServer(("", PORT), YahooProxyHandler) as httpd:
    httpd.serve_forever()
