// Run from repo root:  node cleanup-repo.js
// Safe to re-run — every step checks existence first.

const fs = require('fs');
const path = require('path');

function removeDir(target, label) {
  const full = path.resolve(target);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`✔ Removed ${label} (${target})`);
  } else {
    console.log(`— Skipped ${label}, not found at ${target}`);
  }
}

function removeFile(target, label) {
  const full = path.resolve(target);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log(`✔ Removed ${label} (${target})`);
  } else {
    console.log(`— Skipped ${label}, not found at ${target}`);
  }
}

console.log('--- EHN repo cleanup ---\n');

// 1. Ghost duplicate folder left behind by the git submodule issue.
//    mobile/mobile/src/* should all be empty dirs with 2 orphan scripts —
//    your real code is in mobile/src/*, untouched by this.
removeDir('mobile/mobile', 'ghost duplicate folder mobile/mobile');

// 2. Stray root-level node_modules from an old wrong-directory `npm install`.
//    Your real backend deps live in backend/node_modules — this one is dead weight.
removeDir('node_modules', 'stray root node_modules');
removeFile('package-lock.json', 'stray root package-lock.json');

// 3. Dead frontend/ folder left over from before the Next.js dashboard existed.
removeDir('frontend', 'empty legacy frontend/ folder');

// 4. Stale Railway config — you're on Render now.
removeFile('railway.json', 'stale railway.json');

console.log('\n--- Done ---');
console.log('Next steps:');
console.log('1. Open package.json and remove "express-rate-limit" from');
console.log('   dependencies — nothing at repo root uses it, it belongs only');
console.log('   in backend/package.json (which already has it).');
console.log('2. Run `npm install` at repo root again if you want a clean lockfile.');
console.log('3. Review `git status` before committing — this only touches your');
console.log('   working directory, not git history.');
