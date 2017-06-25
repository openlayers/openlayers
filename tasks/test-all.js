const Server = require('karma').Server;
const closure = require('closure-util');
const path = require('path');
const processCliArgs = require('karma/lib/cli').process;

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
  const dependencies = manager.getDependencies().map(script => script.path);
  dependencies.reverse().forEach(filePath => {
    files.unshift({
      pattern: filePath,
      included: true,
      served: true,
      watched: true
    });
  });

  // stop goog base.js from trying to load deps.js
  files.unshift({
    pattern: path.resolve(__dirname, '../test/no-deps.js'),
    included: true,
    served: true,
    watched: false
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
