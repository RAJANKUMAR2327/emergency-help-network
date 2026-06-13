const { execSync } = require('child_process');

try {
  execSync('git rm --cached dashboard -r', { stdio: 'inherit' });
} catch(e) {}
try {
  execSync('git rm --cached mobile -r', { stdio: 'inherit' });
} catch(e) {}

const fs = require('fs');
if (fs.existsSync('.gitmodules')) {
  fs.unlinkSync('.gitmodules');
  console.log('Deleted .gitmodules');
}

execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "fix: remove submodules track all as regular folders"', { stdio: 'inherit' });
execSync('git pull origin main --rebase', { stdio: 'inherit' });
execSync('git push origin main --force', { stdio: 'inherit' });
console.log('Done!');