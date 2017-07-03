const Server = require('karma').Server;
const closure = require('closure-util');
const path = require('path');
const processCliArgs = require('karma/lib/cli').process;

function insertDependencies(manager, files, previousLookup) {
  previousLookup = previousLookup || {};
  let firstIndex = NaN;
  const original = files.filter((obj, index) => {
    if (previousLookup[obj.pattern]) {
      if (isNaN(firstIndex)) {
        firstIndex = index;
      }
      return false;
    } else {
      return true;
    }
  });
  if (isNaN(firstIndex)) {
    firstIndex = 0;
  }
  const lookup = {};
  const dependencies = manager.getDependencies().map(script => {
    lookup[script.path] = true;
    return {
      pattern: script.path,
      included: true,
      served: true,
      watched: false
    };
  });
  original.splice.apply(original, [firstIndex, 0].concat(dependencies));
  files.length = 0;
  files.push.apply(files, original);

  return lookup;
}

/**
 * Start Karma.  This prepends the Karma `files` config with all library files
 * sorted in dependency order.
 * @param {Object} config Karma options.
 * @param {Manager} manager The dependency file manager.
 * @param {function(Error)} callback Called with any error.
 */
function serve(config, manager, callback) {
  function exit(code) {
    let error = null;
    if (code) {
      error = new Error(`Karma exited with ${code}`);
      error.code = code;
    }
    callback(error);
  }
  const server = new Server(config, exit);

  const files = server.get('config.files');

  let lookup = insertDependencies(manager, files);

  // stop goog base.js from trying to load deps.js
  files.unshift({
    pattern: path.resolve(__dirname, '../test/no-deps.js'),
    included: true,
    served: true,
    watched: false
  });

  manager.on('update', () => {
    lookup = insertDependencies(manager, files, lookup);
    server.refreshFiles();
  });

  server.start();
}

function main(config, callback) {
  const manager = new closure.Manager({
    lib: [
      'src/**/*.js',
      'build/ol.ext/*.js'
    ]
  });

  manager.on('error', callback);

  manager.on('ready', () => {
    serve(config, manager, callback);
  });
}

if (require.main === module) {
  const config = processCliArgs();
  main(config, (err, manager) => {
    if (err) {
      process.stderr.write(err.message, () => process.exit(1));
      return;
    } else {
      process.exit(0);
    }
  });
}
