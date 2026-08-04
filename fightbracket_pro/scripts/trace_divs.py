with open('c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/AccountDashboard.tsx', encoding='utf-8') as f:
    text = f.read()

import re

start = text.find('{/* Page heading */}')
end = text.find('</>', start)
fragment_text = text[start:end]

lines = fragment_text.split('\n')
stack = []
for i, line in enumerate(lines):
    opens = re.findall(r'<div(?=\s|>)(?:[^>]*?(?:\"[^\"]*\")?)*?(?<!/)>', line)
    closes = line.count('</div')
    
    for tag in opens:
        match = re.search(r'className=\"([^\"]*)\"', tag)
        cls = match.group(1)[:20] if match else tag[:20]
        print('  ' * len(stack) + f'OPEN: {cls}')
        stack.append(cls)
    
    for _ in range(closes):
        if stack:
            popped = stack.pop()
            print('  ' * len(stack) + f'CLOSE: {popped}')
        else:
            print('EXTRA CLOSE!')

print('UNCLOSED:')
for tag in stack:
    print(tag)
