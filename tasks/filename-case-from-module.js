const glob = require('glob');
const fs = require('fs');
const path = require('path');

glob('src/**/*.js', {}, function(err, files) {
  if (!err) {
    process.stdout.write(`Checking ${files.length} files...\n`);
    let renamed = 0;
    files.forEach(function(filename) {
      const contents = fs.readFileSync(filename, 'utf-8');
      const lines = contents.split('\n');
      for (let i = lines.length - 1; i >= 0; --i) {
        const line = lines[i];
        const match = line.match(/goog\.provide\('.*\.([^']*)'\);$/);
        if (match && match.length) {
          const newName = match[1] + '.js';
          if (newName != newName.toLowerCase()) {
            fs.renameSync(filename, path.resolve(path.dirname(filename), newName));
            ++renamed;
          }
        }
      }
    });
    process.stdout.write(`Renamed ${renamed} files.\n`);
  } else {
    process.stdout.write(err.message);
    process.exit(1);
  }
});
