
import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\sathv\\.gemini\\antigravity\\scratch\\Motion\\components\\CommandPalette.tsx', 'utf8');

const tags = [];
const regex = /<\/?([a-zA-Z0-9\.]+)([\s\S]*?)(\/?)>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const [full, name, attrs, selfClosing] = match;
    const isSelfClosing = selfClosing === '/' || attrs.trim().endsWith('/') || ['input', 'img', 'br', 'hr', 'kbd'].includes(name.toLowerCase());
    
    if (full.startsWith('</')) {
        const last = tags.pop();
        console.log(`Closing: ${name} (matches ${last})`);
        if (last !== name) {
            console.log(`Mismatch: expected ${last} but found ${name} at offset ${match.index}`);
        }
    } else if (isSelfClosing) {
        console.log(`Self-closing: ${name}`);
    } else {
        console.log(`Opening: ${name}`);
        tags.push(name);
    }
}

if (tags.length > 0) {
    console.log('Unclosed tags:', tags);
} else {
    console.log('All tags balanced');
}
