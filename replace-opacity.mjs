import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = {
    'border-black border-opacity-5': 'border-black/5',
    'border-white border-opacity-10': 'border-white/10',
    'hover:bg-white hover:bg-opacity-5': 'hover:bg-white/5',
    'bg-brand-primary bg-opacity-10': 'bg-brand-primary/10',
    'bg-brand-primary bg-opacity-20': 'bg-brand-primary/20',
    'bg-brand-primary bg-opacity-40': 'bg-brand-primary/40',
    'bg-brand-primary bg-opacity-60': 'bg-brand-primary/60',
    'bg-brand-primary bg-opacity-80': 'bg-brand-primary/80',
    'bg-brand-primary bg-opacity-100': 'bg-brand-primary/100',
    'hover:bg-brand-primary hover:bg-opacity-5': 'hover:bg-brand-primary/5',
    'bg-gray-950 bg-opacity-80': 'bg-gray-950/80',
    'bg-brand-accent bg-opacity-20': 'bg-brand-accent/20',
    'hover:bg-black hover:bg-opacity-5': 'hover:bg-black/5',
    'bg-white bg-opacity-30': 'bg-white/30',
    'bg-gray-900 bg-opacity-80': 'bg-gray-900/80',
    'bg-white bg-opacity-10 text-white text-[9px] font-bold rounded cursor-pointer hover:bg-opacity-20': 'bg-white/10 text-white text-[9px] font-bold rounded cursor-pointer hover:bg-white/20',
    'bg-white bg-opacity-10': 'bg-white/10',
    'bg-gray-900 bg-opacity-90': 'bg-gray-900/90',
    'bg-brand-secondary bg-opacity-20': 'bg-brand-secondary/20'
  };

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }

  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/AppFooter.tsx',
  'src/app/user/page.tsx',
  'src/app/upload/page.tsx',
  'src/app/results/page.tsx',
  'src/app/page.tsx'
];

files.forEach(f => replaceInFile(path.join(process.cwd(), f)));
console.log("Done!");
