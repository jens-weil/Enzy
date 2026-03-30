const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Robust Deployment Packager
 * 1. Builds the project
 * 2. Copies production files to a temp directory (to avoid file locking issues)
 * 3. Zips the directory
 * 4. Cleans up
 */

const ZIP_NAME = 'deploy.zip';
const TEMP_DIR = 'deploy_pkg';
const FILES_TO_INCLUDE = [
  '.next',
  'public',
  'data',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  '.env.local'
];

async function main() {
  try {
    console.log('--- Step 1: Building the project ---');
    // We run build to ensure .next contains production artifacts
    execSync('npm run build', { stdio: 'inherit' });

    console.log('--- Step 2: Preparing files for packaging ---');
    
    // Clean old temp dir if exists
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR);

    // Copy files one by one to avoid locking issues with the whole directory
    for (const file of FILES_TO_INCLUDE) {
      const src = path.join(__dirname, file);
      const dest = path.join(__dirname, TEMP_DIR, file);

      if (fs.existsSync(src)) {
        console.log(`Copying ${file}...`);
        // Use powershell copy to be robust on Windows
        if (fs.lstatSync(src).isDirectory()) {
            // Exclude development specific subfolders from .next if they cause issues
            const excludePattern = file === '.next' ? '-Exclude "cache","dev"' : '';
            execSync(`powershell -Command "Copy-Item -Path '${src}' -Destination '${dest}' -Recurse -Force ${excludePattern}"`, { stdio: 'inherit' });
        } else {
            fs.copyFileSync(src, dest);
        }
      }
    }

    console.log('--- Step 3: Creating ' + ZIP_NAME + ' ---');
    // Zip the temp directory
    const psCommand = `powershell -Command "Compress-Archive -Path .\\${TEMP_DIR}\\* -DestinationPath .\\${ZIP_NAME} -Force"`;
    execSync(psCommand, { stdio: 'inherit' });

    console.log('--- Step 4: Cleaning up ---');
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });

    console.log('\n--- SUCCESS: ' + ZIP_NAME + ' has been created! ---');
    console.log('This zip file is now ready for deployment to your server.');
    console.log('Note: Run "npm install --production" on your server after unzipping.');

  } catch (error) {
    console.error('\nError during packaging:', error.message);
    // Cleanup if failed
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

main();
