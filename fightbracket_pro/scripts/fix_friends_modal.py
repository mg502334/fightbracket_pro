import re

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/FriendsModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all instances of `fetch('/api/X'` with `fetch(`${API_URL}/api/X``
# Regex pattern: fetch\('/api/([^']+)'\) or fetch\('/api/([^']+)',
def replace_fetch_quote(match):
    path = match.group(1)
    return f"fetch(`${{API_URL}}/api/{path}`"

text = re.sub(r"fetch\('/api/([^']+)'", replace_fetch_quote, text)

# Replace all instances of `fetch(`/api/X`` with `fetch(`${API_URL}/api/X``
def replace_fetch_tick(match):
    path = match.group(1)
    return f"fetch(`${{API_URL}}/api/{path}`"

text = re.sub(r"fetch\(`/api/([^`]+)`", replace_fetch_tick, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('FriendsModal fixed!')
