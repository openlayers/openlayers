/*
 * This plugin parses goog.exportSymbol and goog.exportProperty calls to build
 * a list of API symbols and properties. Everything else is marked undocumented,
 * which will remove it from the docs.
 */

var api = [];

function collectExports(source) {
  var i, ii, symbol, property;
  var syms = source.match(/goog\.exportSymbol\([^\)]*\)/g);
  if (syms) {
    i = 0; ii = syms.length;
    for (; i < ii; ++i) {
      symbol = syms[i].match(/'([^']*)'/)[1];
      api.push(symbol);
    }
  }
  var props = source.match(/goog\.exportProperty\([^\)]*\)/g);
  if (props) {
    i = 0; ii = props.length;
    for (; i < ii; ++i) {
      property = props[i].match(/[^,]*,[^,]*,\r?\n? *([^\)]*)\)/)[1]
          .replace('.prototype.', '#');
      api.push(property);
    }
  }
}

var encoding = env.conf.encoding || 'utf8';
var fs = require('jsdoc/fs');
collectExports(fs.readFileSync('build/src/external/src/exports.js', encoding));
collectExports(fs.readFileSync('build/src/external/src/types.js', encoding));


exports.handlers = {
  
  beforeParse: function(e) {
    if (/\.js$/.test(e.filename)) {
      collectExports(e.source);
    }
  },
  
  newDoclet: function(e) {
    if (api.indexOf(e.doclet.longname) > -1) {
      // Add params of API symbols to the API
      var names, name;
      var params = e.doclet.params;
      if (params) {
        for (var i = 0, ii = params.length; i < ii; ++i) {
          names = params[i].type.names;
          if (names) {
            for (var j = 0, jj=names.length; j < jj; ++j) {
              name = names[j];
              if (api.indexOf(name) === -1) {
                api.push(name);
              }
            }
          }
        }
      }
    }
  }
  
};


function filter(e) {
  if (e.doclet) {
    var fqn = e.doclet.longname;
    if (fqn) {
      e.doclet.undocumented = (api.indexOf(fqn) === -1);
      // Remove parents that are not part of the API
      var parent;
      var parents = e.doclet.augments;
      if (parents) {
        for (var i = parents.length - 1; i >= 0; --i) {
          parent = parents[i];
          if (api.indexOf(parent) === -1) {
            parents.splice(i, 1);
          }
        }
      }
    }
  }
}

exports.nodeVisitor = {

  visitNode: function(node, e, parser, currentSourceName) {
    // filter out non-API symbols before the addDocletRef finisher is called
    e.finishers.unshift(filter);
  }
};
