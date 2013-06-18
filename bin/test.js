var path = require('path');
var fs = require('fs');
var glob = require('glob');
var cp = require('child_process');

var base = path.join(__dirname, '..');

// get the most recent plovr.jar
var plovr = glob.sync('bin/plovr*.jar').sort(function(a, b) {
  return fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime();
}).pop();
if (!plovr) {
  console.error('Unable to find plovr.jar.  Run `npm install` first');
  process.exit(1);
}

// get the various plovr config files
var builds = ['buildcfg/ol.json', 'buildcfg/ol-all.json'];
var examples = glob.sync('build/examples/*.json', {cwd: base});
var tests = ['buildcfg/test.json'];

// start up the plovr server
var serve = cp.spawn(
    'java',
    ['-jar', plovr, 'serve'].concat(builds, examples, tests),
    {cwd: base});

// prepare to start karma
function startTestacular() {
  var karma = cp.fork(
      path.join(base, 'node_modules', 'karma', 'bin', 'karma'),
      process.argv.splice(2), {cwd: base});

  karma.on('exit', function(code) {
    process.exit(code);
  });
}

serve.stderr.on('data', function(chunk) {
  process.stderr.write(chunk);
  if (chunk.toString().indexOf('Listening on') === 0) {
    startTestacular();
  }
});

serve.stdout.on('data', function(chunk) {
  // plovr doesn't write to stdout, but if it does in the future ...
  process.stdout.write(chunk);
  startTestacular();
});

serve.on('exit', function(code) {
  process.exit(code);
});

process.on('exit', function(code) {
  if (serve.connected) {
    serve.disconnect();
  }
  serve.kill();
});
