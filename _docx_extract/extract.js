const fs = require('fs');
const input = 'C:/Users/user/Downloads/fk-chairman-partner-os (3)/_docx_extract/word/document.xml';
const output = 'C:/Users/user/Downloads/fk-chairman-partner-os (3)/_docx_extract/doc.txt';
let xml = fs.readFileSync(input, 'utf8');
xml = xml
  .replace(/<w:tab\/>/g, '\t')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n');
let txt = xml
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[^;]+;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
fs.writeFileSync(output, txt, 'utf8');
console.log('ok', txt.length);
