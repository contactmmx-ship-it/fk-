const fs = require('fs');
const input = 'C:/Users/user/Downloads/fk-chairman-partner-os (3)/_docx_extract/word/document.xml';
const output = 'C:/Users/user/Downloads/fk-chairman-partner-os (3)/_docx_extract/doc_lines.txt';
let xml = fs.readFileSync(input, 'utf8');
xml = xml
  .replace(/<w:tab\/>/g, '\t')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<\/w:tr>/g, '\n');
let txt = xml
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
// collapse spaces per-line, keep newlines
txt = txt
  .split(/\r?\n/)
  .map(l => l.replace(/[ \t]+/g, ' ').trim())
  .filter(l => l.length > 0)
  .join('\n');
fs.writeFileSync(output, txt, 'utf8');
console.log('ok_lines', txt.split(/\n/).length);
