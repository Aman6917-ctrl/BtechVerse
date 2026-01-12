#!/usr/bin/env python3
import os
import glob

# Get environment variables
FIREBASE_API_KEY = os.environ.get('FIREBASE_API_KEY', '')
FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
FIREBASE_APP_ID = os.environ.get('FIREBASE_APP_ID', '')

print("Building environment configuration...")
print(f"Firebase API Key: {'✓' if FIREBASE_API_KEY else '✗'}")
print(f"Firebase Project ID: {'✓' if FIREBASE_PROJECT_ID else '✗'}")
print(f"Firebase App ID: {'✓' if FIREBASE_APP_ID else '✗'}")

# Create environment meta tags
env_meta_tags = f'''<meta name="env-FIREBASE_API_KEY" content="{FIREBASE_API_KEY}">
    <meta name="env-FIREBASE_PROJECT_ID" content="{FIREBASE_PROJECT_ID}">
    <meta name="env-FIREBASE_APP_ID" content="{FIREBASE_APP_ID}">'''

# Find all HTML files
html_files = glob.glob('*.html')

for html_file in html_files:
    print(f"Processing {html_file}...")
    
    # Read the file
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if env meta tags already exist
    if 'env-FIREBASE_API_KEY' in content:
        # Remove existing env meta tags
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if 'name="env-FIREBASE_' not in line:
                new_lines.append(line)
        content = '\n'.join(new_lines)
    
    # Add env meta tags before closing head tag
    if '</head>' in content:
        content = content.replace('</head>', f'    {env_meta_tags}\n</head>')
        
        # Write back to file
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Updated {html_file}")
    else:
        print(f"⚠ No </head> tag found in {html_file}")

print("Environment configuration complete!")