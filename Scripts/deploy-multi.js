const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer').default;

// Get the Git directory (where all projects are) - parent of current project
const gitDir = path.dirname(__dirname);

console.log(`Scanning for projects in: ${gitDir}`);

const projects = fs.readdirSync(gitDir)
  .filter(dir => {
    const dirPath = path.join(gitDir, dir);
    try {
      const isDir = fs.statSync(dirPath).isDirectory();
      const hasPackageJson = fs.existsSync(path.join(dirPath, 'package.json'));
      return isDir && hasPackageJson;
    } catch {
      return false;
    }
  })
  .sort();

async function main() {
  console.log(`\nFound ${projects.length} deployable project(s)\n`);

  if (projects.length === 0) {
    console.log('No projects with package.json found.');
    process.exit(1);
  }

  const { project } = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
      message: 'Choose a project to deploy:',
      choices: projects
    }
  ]);

  const projectPath = path.join(gitDir, project);
  process.chdir(projectPath);
  console.log(`\nDeploying from: ${projectPath}\n`);

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
    console.log(`Building ${project}...`);
    execSync('npm run build', { stdio: 'inherit' });

    // Add and commit
    console.log('Committing changes...');
    execSync('git add .');
    execSync(`git commit -m "Deploy ${project} to ${remote}"`, { stdio: 'inherit' });

    // Get current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

    // Push
    console.log(`Pushing ${project} to ${remote}...`);
    execSync(`git push ${remote} ${branch}`, { stdio: 'inherit' }); // Assume main branch

    console.log('Deployment successful!');

  } catch (error) {
    console.error('Error during deployment:', error.message);
    process.exit(1);
  }
}

main();