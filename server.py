#!/usr/bin/env python3
import http.server
import socketserver
import os
import re
import json
import urllib.request
import urllib.parse
import ssl
from urllib.parse import urlparse

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed, manually load .env file
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    except FileNotFoundError:
        pass  # .env file doesn't exist, use environment variables or defaults

class BTechVerseHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # If requesting an HTML file, inject environment variables
        if path.endswith('.html') or path == '/' or path == '':
            # Default to index.html for root path
            if path == '/' or path == '':
                file_path = 'index.html'
            else:
                file_path = path.lstrip('/')
            
            try:
                # Read the HTML file
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Get environment variables
                firebase_api_key = os.environ.get('VITE_FIREBASE_API_KEY', '')
                firebase_app_id = os.environ.get('VITE_FIREBASE_APP_ID', '')
                firebase_project_id = os.environ.get('VITE_FIREBASE_PROJECT_ID', '')
                
                # Inject environment variables as meta tags
                env_meta_tags = f'''
    <meta name="env-FIREBASE_API_KEY" content="{firebase_api_key}">
    <meta name="env-FIREBASE_APP_ID" content="{firebase_app_id}">
    <meta name="env-FIREBASE_PROJECT_ID" content="{firebase_project_id}">'''
                
                # Insert meta tags before closing head tag
                content = re.sub(r'</head>', env_meta_tags + '\n</head>', content, flags=re.IGNORECASE)
                
                # Send the response
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', len(content.encode('utf-8')))
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return
                
            except FileNotFoundError:
                pass  # Fall back to default behavior
        
        # For all other requests, use default behavior
        super().do_GET()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Handle chatbot API endpoint
        if path == '/api/chat':
            try:
                # Read request body
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                # Get API key from environment variable (should be in .env file)
                api_key = os.environ.get('OPENAI_API_KEY', '')
                if not api_key:
                    raise ValueError('OPENAI_API_KEY not found in environment variables. Please set it in .env file.')
                
                # Prepare OpenAI API request
                openai_url = 'https://api.openai.com/v1/chat/completions'
                openai_data = {
                    'model': data.get('model', 'gpt-3.5-turbo'),
                    'messages': data.get('messages', []),
                    'max_tokens': data.get('max_tokens', 1000),
                    'temperature': data.get('temperature', 0.7)
                }
                
                # Create request
                req = urllib.request.Request(
                    openai_url,
                    data=json.dumps(openai_data).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {api_key}'
                    }
                )
                
                # Create SSL context (disable verification for development)
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                # Make request
                with urllib.request.urlopen(req, context=ctx) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    
                    # Send response back to client
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(result).encode('utf-8'))
                    return
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                self.send_response(e.code)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(error_body.encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_response = {'error': str(e)}
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
                return
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    PORT = 8000
    
    # Print environment variables for debugging (without showing the actual values)
    print("Starting BTechVerse Server...")
    print(f"Firebase API Key configured: {'Yes' if os.environ.get('VITE_FIREBASE_API_KEY') else 'No'}")
    print(f"Firebase App ID configured: {'Yes' if os.environ.get('VITE_FIREBASE_APP_ID') else 'No'}")
    print(f"Firebase Project ID configured: {'Yes' if os.environ.get('VITE_FIREBASE_PROJECT_ID') else 'No'}")
    print(f"OpenAI API Key configured: {'Yes' if os.environ.get('OPENAI_API_KEY') else 'No'}")
    
    with socketserver.TCPServer(("", PORT), BTechVerseHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")