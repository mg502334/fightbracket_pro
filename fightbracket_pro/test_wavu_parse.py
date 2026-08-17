import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

html = open('wavu_profile.html', 'r', encoding='utf-8').read()

print("Extracting most recent character from Wavu matches...")

# The match table usually has rows like <tr class="match">...
# Let's just find the first character name associated with the player.
# Wavu profile has `<div class="char">Nina</div>` or `<span class="char">Nina</span>`

char_spans = re.findall(r'<span class="char">([^<]+)</span>', html)
if char_spans:
    print("Found character spans (first 5):", char_spans[:5])

char_divs = re.findall(r'<div class="char">([^<]+)</div>', html)
if char_divs:
    print("Found character divs (first 5):", char_divs[:5])
