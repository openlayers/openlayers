var buildExt = require('./build-ext');

buildExt(function(err) {
  if (err) {
    process.stderr.write(err + '\n');
    process.exit(1);
  } else {
    process.exit(0);
  }
});
