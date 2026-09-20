const fs = require('fs');
const path = require('path');

const mapping = {
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
};

const baseDir = path.join(__dirname, 'src', 'app');
let count = 0;

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            for (const [oldC, newC] of Object.entries(mapping)) {
                content = content.split(oldC).join(newC);
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                count++;
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

walkDir(baseDir);
console.log(`Replaced colors in ${count} files.`);
