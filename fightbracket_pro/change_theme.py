import os

mapping = {
    "'#050A14'": "'var(--background)'",
    "'#080E1C'": "'var(--sidebar)'",
    "'#0A1428'": "'var(--card)'",
    "'#E8F4F8'": "'var(--foreground)'",
    "'#7A9EC0'": "'var(--muted-foreground)'",
    "'rgba(0,229,255,0.08)'": "'var(--border)'",
    "'rgba(122,158,192,0.12)'": "'var(--border)'",
    "'rgba(122,158,192,0.1)'": "'var(--border)'",
    "'rgba(122,158,192,0.06)'": "'var(--border)'",
    "'rgba(122,158,192,0.08)'": "'var(--border)'",
    "'rgba(122,158,192,0.05)'": "'var(--border)'",
    "'#0A0A0F'": "'var(--background)'",
    "'#1A1A2E'": "'var(--muted)'"
}

base_dir = r"c:\Projects\fightbracket_pro\fightbracket_pro\src\app"
count = 0

for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            for old_c, new_c in mapping.items():
                content = content.replace(old_c, new_c)
                
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                print(f"Updated {path}")

print(f"Replaced colors in {count} files.")
