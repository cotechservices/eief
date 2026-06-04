const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'app', 'dashboard', 'admin');
const comptableDir = path.join(__dirname, 'app', 'dashboard', 'comptable');

// 1. Create Admin Reinscriptions
const adminPreinsPath = path.join(adminDir, 'preinscriptions', 'page.tsx');
const adminReinsDir = path.join(adminDir, 'reinscriptions');
const adminReinsPath = path.join(adminReinsDir, 'page.tsx');

if (!fs.existsSync(adminReinsDir)) {
  fs.mkdirSync(adminReinsDir, { recursive: true });
}

let preinsContent = fs.readFileSync(adminPreinsPath, 'utf8');
let reinsContent = preinsContent
  .replace(/preinscriptions/g, 'reinscriptions')
  .replace(/preinscription/g, 'reinscription')
  .replace(/Preinscriptions/g, 'Reinscriptions')
  .replace(/Preinscription/g, 'Reinscription')
  .replace(/pré-inscriptions/g, 'réinscriptions')
  .replace(/pré-inscription/g, 'réinscription')
  .replace(/Pré-inscriptions/g, 'Réinscriptions')
  .replace(/Pré-inscription/g, 'Réinscription');

fs.writeFileSync(adminReinsPath, reinsContent);
console.log('Created admin/reinscriptions/page.tsx');

// 2. Create Comptable re-exports
const pagesToExport = [
  'preinscriptions',
  'reinscriptions',
  'eleves',
  'classes',
  'enseignants',
  'personnel'
];

pagesToExport.forEach(pageName => {
  const compPageDir = path.join(comptableDir, pageName);
  if (!fs.existsSync(compPageDir)) {
    fs.mkdirSync(compPageDir, { recursive: true });
  }
  
  // To avoid Next.js issues with re-exporting client components, we can just use the exact same page structure
  // but it's simpler to just import and re-export. Let's write the wrapper:
  const content = `"use client";
import Page from "../../admin/${pageName}/page";
export default Page;
`;
  fs.writeFileSync(path.join(compPageDir, 'page.tsx'), content);
  console.log(`Created comptable/${pageName}/page.tsx`);
});
