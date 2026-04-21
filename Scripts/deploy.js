const { execSync } = require('child_process');
const inquirer = require('inquirer').default;

async function main() {
  try {
    // Check if git repo
    execSync('git status', { stdio: 'pipe' });

    // Get remotes
    const remotesOutput = execSync('git remote', { encoding: 'utf8' });
    const remotes = remotesOutput.split('\n').filter(line => line.trim());

    if (remotes.length === 0) {
      console.log('No git remotes found. Please set up git remotes for your websites.');
      process.exit(1);
    }

    const { remote } = await inquirer.prompt([
      {
        type: 'list',
        name: 'remote',
        message: 'Choose a website/remote to deploy to:',
        choices: remotes
      }
    ]);

    // Build
    console.log('Building the project...');
    execSync('npm run build', { stdio: 'inherit' });

    // Add and check for changes
    console.log('Checking for changes...');
    execSync('git add .');
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    
    if (status) {
      console.log('Committing changes...');
      execSync(`git commit -m "Deploy to ${remote}"`, { stdio: 'inherit' });
    } else {
      console.log('No changes to commit, skipping commit step.');
    }

    // Get current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

    // Push
    console.log(`Pushing to ${remote}...`);
    execSync(`git push ${remote} ${branch}`, { stdio: 'inherit' });

    console.log('Deployment successful!');

  } catch (error) {
    console.error('Error during deployment:', error.message);
    process.exit(1);
  }
}

main();