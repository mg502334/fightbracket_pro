import re

html = open('wavu_profile.html', 'r', encoding='utf-8').read()

# Let's see if we can find character names and ranks
# Usually wavu has a list of characters
for match in re.finditer(r'<td class="character">.*?</td>', html, re.DOTALL | re.IGNORECASE):
    print(match.group(0))

for match in re.finditer(r'<div class="character-name">.*?</div>', html, re.DOTALL | re.IGNORECASE):
    print(match.group(0))

print("Total length:", len(html))
