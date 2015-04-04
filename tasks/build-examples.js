/*global Buffer */
var fs = require('fs');
var path = require('path');

var async = require('async');
var glob = require('glob');
var Gaze = require('gaze').Gaze;
var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var marked = require('marked');
var once = require('once');

var log = require('closure-util').log;

var pjson = require('../package.json');

var fileRegEx = /([^\/^\.]*)\.html$/;
var cleanupJSRegEx = /.*(goog\.require(.*);|.*renderer: exampleNS\..*,?)[\n]*/g;
var isCssRegEx = /\.css$/;
var isJsRegEx = /\.js$/;


var watcher;

function watch(files, metalsmith, done) {

  function rebuild(filepath, name) {
    var paths = [filepath];
    var files = {};

    function readFile(filepath2, cb) {
      metalsmith.readFile(filepath2, function(err, file) {
        if (err) { return cb(err); }
        var rel = path.relative(this.source(), filepath2);
        files[rel] = file;
        cb();
      });
    }

    if (filepath.search(fileRegEx) === -1) {
      paths.push(filepath.replace(/\.[0-9a-z]+$/, '.html'));
    }

    async.each(paths, readFile, function(err) {
      if (err) { throw err; }
      metalsmith.run(files, 0, function(err, files) {
        if (err) { throw err; }

        metalsmith.write(files, function(err) {
          if (err) { throw err; }
          Object.keys(files).forEach(function(f) {
            log.info('examples', 'Updated ' + f);
          });
        });
      });
    });
  }

  if (!watcher) {
    var source = metalsmith.source();
    
    watcher = new Gaze('**/*', {cwd: source});

    watcher.on('ready', once(function() {
      log.info('examples', 'Watching ' + source);
      done();
    }));

    watcher.on('all', function(event, filepath) {
      var name = path.relative(source, filepath);
      log.info('examples', filepath + ' has changed');
      fs.lstat(filepath, function(err, stats) {
        if (err || stats.isDirectory() === true) { return; }
        rebuild(filepath, name);
      });
    });
  } else {
    done();
  }

}


function build(files) {
  var file, match, str;
  for (var f in files) {
    file = files[f];
    match = f.match(fileRegEx);
    if (match) {
      if (file.template) {
        if (file.docs) {
          file.docs = marked(file.docs);
        }
        if (file.contents) {
          str = marked(file.contents.toString());
          file.contents = new Buffer(str);
        }
        file.ol_version = pjson.version;
        file.js_resource = '<script src="loader.js?id=' + match[1] +
            '"></script>';
        var js = fs.readFileSync(__dirname + '/../examples_src/' +
            match[1] + '.js', 'utf8');
        file.js_inline = js.replace(cleanupJSRegEx, '');
        var cssFile = __dirname + '/../examples_src/' + match[1] + '.css';
        if (fs.existsSync(cssFile)) {
          file.css_resource = '<link rel="stylesheet" href="' + match[1] +
              '.css">';
          file.css_inline = fs.readFileSync(cssFile, 'utf-8');
        }
        if (file.resources) {
          var resources = file.resources.split(',');
          var resource;
          for (var i = resources.length - 1; i >= 0; --i) {
            resource = resources[i];
            if (isJsRegEx.test(resource)) {
              resources[i] = '<script src="' + resource + '"></script>';
            } else if (isCssRegEx.test(resource)) {
              resources[i] = '<link rel="stylesheet" href="' + resource +
                  '">';
            } else {
              throw new Error(f + ': Invalid value for "resource": ' +
                  resource + ' is no .js or .css.');
            }
            file.resources = resources.join('\n');
          }
        }
      } else if (f !== 'index.html'){
        throw new Error(f + ': Invalid YAML front-matter.');
      }
    }
  }
}

/**
 * Build examples
 * @param {Function} callback
 * @param {bool} watchFiles Watch files for changes
 * @return {undefined}
 */
function main(callback, watchFiles) {

  var metalsmith = new Metalsmith('.')
    .source('examples_src')
    .destination('examples')
    .use(build)
    .use(templates({
      engine: 'handlebars',
      directory: 'config/examples'
    }))

  if (watchFiles) {
    metalsmith.use(watch);
  }
  metalsmith.build(callback);

}


if (require.main === module) {
  main(function(err) {
    if (err) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    } else {
      process.exit(0);
    }
  }, false);
}

module.exports = main;
