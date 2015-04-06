/*global Buffer */
var path = require('path');

var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var marked = require('marked');
var pkg = require('../package.json');

var fileRegEx = /([^\/^\.]*)\.html$/;
var cleanupJSRegEx = /.*(goog\.require(.*);|.*renderer: exampleNS\..*,?)[\n]*/g;
var isCssRegEx = /\.css$/;
var isJsRegEx = /\.js$/;

var srcDir = path.join(__dirname, '..', 'examples_src');
var destDir = path.join(__dirname, '..', 'examples');
var templatesDir = path.join(__dirname, '..', 'config', 'examples');

function main(callback) {

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
          file.js_resource = '<script src="loader.js?id=' + match[1] +
              '"></script>';
          var js = files[match[1] + '.js'].contents.toString();
          file.js_inline = js.replace(cleanupJSRegEx, '');
          var cssFilename = match[1] + '.css';
          if (cssFilename in files) {
            file.css_resource = '<link rel="stylesheet" href="' + cssFilename +
                '">';
            file.css_inline = files[cssFilename].contents.toString();
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
                callback(new Error(f + ': Invalid value for "resource": ' +
                    resource + ' is no .js or .css.'));
              }
              file.resources = resources.join('\n');
            }
          }
        } else if (f !== 'index.html') {
          callback(new Error(f + ': Invalid YAML front-matter.'));
        }
      }
    }
  }


  new Metalsmith('.')
      .source(srcDir)
      .destination(destDir)
      .metadata({
        'ol_version': pkg.version
      })
      .use(build)
      .use(templates({
        engine: 'handlebars',
        directory: templatesDir
      }))
      .build(function(err) {
        callback(err);
      });
}


if (require.main === module) {
  main(function(err) {
    if (err) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

module.exports = main;
