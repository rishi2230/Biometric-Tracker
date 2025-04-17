import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

// Define important directories
const BASE_DIR = '.';
const EXPORT_DIR = join(BASE_DIR, 'code_export');

// Create export directory structure
if (!existsSync(EXPORT_DIR)) {
  mkdirSync(EXPORT_DIR, { recursive: true });
}

// Function to create directories recursively
function createDirectory(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

// Function to copy file and create directory if needed
function copyFile(sourcePath, targetPath) {
  const targetDir = dirname(targetPath);
  createDirectory(targetDir);
  
  try {
    const content = readFileSync(sourcePath, 'utf8');
    writeFileSync(targetPath, content);
    console.log(`Copied: ${sourcePath} -> ${targetPath}`);
  } catch (err) {
    console.error(`Error copying ${sourcePath}: ${err.message}`);
  }
}

// Function to copy directory recursively
function copyDir(sourceDir, targetDir) {
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  
  const files = readdirSync(sourceDir);
  
  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);
    
    const stats = statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (['node_modules', '.git', 'dist', '.cache'].includes(file)) {
        continue;
      }
      copyDir(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

// Core directories to copy
const coreDirs = ['client', 'server', 'shared'];
for (const dir of coreDirs) {
  const sourceDir = join(BASE_DIR, dir);
  const targetDir = join(EXPORT_DIR, dir);
  if (existsSync(sourceDir)) {
    copyDir(sourceDir, targetDir);
  }
}

// Important configuration files to copy
const configFiles = [
  'package.json',
  'drizzle.config.ts',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'theme.json'
];

for (const file of configFiles) {
  const sourcePath = join(BASE_DIR, file);
  const targetPath = join(EXPORT_DIR, file);
  if (existsSync(sourcePath)) {
    copyFile(sourcePath, targetPath);
  }
}

// Create a sample .env file
const envContent = `DATABASE_URL=postgres://username:password@localhost:5432/attendance_system
SESSION_SECRET=your-secret-key-for-sessions
`;

writeFileSync(join(EXPORT_DIR, '.env'), envContent);

// Create a README.md with instructions
const readmeContent = `# Biometric Attendance System

## Setup Instructions

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up PostgreSQL database and update the .env file with your database connection details

3. Push the database schema:
\`\`\`bash
npm run db:push
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Access the application at http://localhost:5000

## Default Credentials

- Username: faculty
- Password: password
`;

writeFileSync(join(EXPORT_DIR, 'README.md'), readmeContent);

console.log(`\nExport completed! Find your files in the ${EXPORT_DIR} directory.\n`);
console.log(`To download from Replit, navigate to the Files panel, select the 'code_export' folder,`);
console.log(`right-click and select 'Download' or select multiple files to download them together.`);