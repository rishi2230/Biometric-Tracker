#!/bin/bash

# Create an export directory
mkdir -p code_export

# Copy key directories and files
cp -r client code_export/
cp -r server code_export/
cp -r shared code_export/
cp package.json code_export/
cp drizzle.config.ts code_export/
cp tsconfig.json code_export/ 2>/dev/null || :
cp vite.config.ts code_export/ 2>/dev/null || :
cp tailwind.config.ts code_export/ 2>/dev/null || :
cp postcss.config.js code_export/ 2>/dev/null || :
cp theme.json code_export/ 2>/dev/null || :

# Create a sample .env file
cat > code_export/.env << EOL
DATABASE_URL=postgres://username:password@localhost:5432/attendance_system
SESSION_SECRET=your-secret-key-for-sessions
EOL

# Create a zip file
cd code_export
zip -r ../project_export.zip .
cd ..

echo "Export completed! Find your files in project_export.zip"