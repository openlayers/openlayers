/*global Buffer */

var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var marked = require('marked');
var fs = require('fs');
var pjson = require('../package.json');

var fileRegEx = /([^\/^\.]*)\.html$/;
var cleanupJSRegEx = /.*(goog\.require(.*);|.*renderer: exampleNS\..*,?)[\n]*/g;
var isCssRegEx = /\.css$/;
var isJsRegEx = /\.js$/;

function main(callback) {

  function build(files) {
    var file, match, str;
    for (var f in files) {
      file = files[f];
      match = f.match(fileRegEx);
      if (match) {
        if (file.title) {
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
                callback(new Error('Resource ' + resource +
                    ' is no .js or .css'));
              }
              file.resources = resources.join('\n');
            }
          }
        }
      }
    }
  }


  new Metalsmith('.')
      .source('examples_src')
      .destination('examples')
      .use(build)
      .use(templates({
        engine: 'handlebars',
        directory: 'config/examples'
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
