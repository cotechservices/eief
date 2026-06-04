const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/pdf');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const levels = [
  { id: 'maternelle', name: 'Creches et Maternelle' },
  { id: 'primaire', name: 'Primaire' },
  { id: 'college', name: 'College' },
  { id: 'lycee', name: 'Lycee' },
  { id: 'renseignement-globale', name: 'Globale de Renseignement' }
];

levels.forEach(level => {
  const objects = [];
  
  // Header
  const header = "%PDF-1.4\n";
  
  // Obj 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Obj 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  
  // Obj 3: Page
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>\nendobj\n");
  
  // Obj 4: Content Stream
  const streamText = `BT
/F1 20 Tf
70 750 Td
(Ecole Internationale des Enfants Futur) Tj
0 -40 Td
(Fiche d'Enseignement - ${level.name}) Tj
0 -40 Td
(Ce document presente le programme detaille et les objectifs pedagogiques.) Tj
ET`;
  const streamObject = `4 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`;
  objects.push(streamObject);
  
  // Calculate offsets
  const offsets = [0]; // Object 0 is dummy
  let currentOffset = header.length;
  
  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    currentOffset += objects[i].length;
  }
  
  // Build xref
  let xref = "xref\n0 5\n0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    xref += `${offsetStr} 00000 n \n`;
  }
  
  const startXref = currentOffset;
  const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  
  const pdfContent = header + objects.join("") + xref + trailer;
  
  fs.writeFileSync(path.join(dir, `fiche-${level.id}.pdf`), pdfContent, 'utf8');
});

console.log('PDFs generated successfully in public/pdf/ directory!');
