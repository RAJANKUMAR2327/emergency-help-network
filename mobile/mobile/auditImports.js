const fs = require('fs');
const path = require('path');

function walk(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.expo') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk('src', []);
let foundIssues = false;

files.forEach((f) => {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  lines.forEach((line, i) => {
    if (/^\s*export\s+(const|default|function|class)/.test(line) || /^\s*import\s+.*from\s+['"]/.test(line)) {
      console.log(f + ':' + (i + 1) + '  ' + line.trim());
      foundIssues = true;
    }
  });
});

if (!foundIssues) {
  console.log('No export/import syntax found in src/. Issue is elsewhere.');
} else {
  console.log('\nFound the lines above using ES module syntax. These need fixing for Metro/CommonJS compatibility.');
}