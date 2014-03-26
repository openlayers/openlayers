/*
 * This plugin parses externs/oli.js as well as goog.exportSymbol and
 * goog.exportProperty calls to build a list of API symbols and properties.
 * Unexported modules linked from @param or @fires will be marked unexported,
 * and the documentation will not contain the constructor. Everything else is
 * marked undocumented, which will remove it from the docs.
 */

var api = [];
var unexported = [];

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

function collectOliExports(source) {
  var oli = source.match(/[^\{]oli\.([^;^ ]*);? ?/g);
  if (oli) {
    i = 0; ii = oli.length;
    for (; i < ii; ++i) {
      property = 'ol.' + oli[i].match(/oli.([^;]*)/)[1]
          .replace('.prototype.', '#');
      api.push(property);
      unexported.push(property);
    }
  }
}

var encoding = env.conf.encoding || 'utf8';
var fs = require('jsdoc/fs');
collectExports(fs.readFileSync('build/src/external/src/exports.js', encoding));
collectOliExports(fs.readFileSync('externs/oli.js', encoding));


exports.handlers = {
  
  beforeParse: function(e) {
    if (/\.js$/.test(e.filename)) {
      collectExports(e.source);
    }
  },
  
  newDoclet: function(e) {
    var i, ii, j, jj;
    if (e.doclet.meta.filename == "objectliterals.jsdoc" && e.doclet.properties) {
      for (i = 0, ii = e.doclet.properties.length; i < ii; ++i) {
        if (e.doclet.properties[i].type && e.doclet.properties[i].type.names) {
          for (j = 0, jj = e.doclet.properties[i].type.names.length; j < jj; ++j) {
            if (e.doclet.properties[i].type.names[j].indexOf('ol') == 0) {
              if (api.indexOf(e.doclet.properties[i].type.names[j]) === -1) {
                api.push(e.doclet.properties[i].type.names[j]);
              }
            }
          }
        }
      }
    }
    if (api.indexOf(e.doclet.longname) > -1) {
      // Add params and events of API symbols to the API
      var names, name;
      var params = e.doclet.params;
      if (params) {
        for (i = 0, ii = params.length; i < ii; ++i) {
          names = params[i].type.names;
          if (names) {
            for (j = 0, jj=names.length; j < jj; ++j) {
              name = names[j];
              if (api.indexOf(name) === -1) {
                unexported.push(name);
              }
            }
          }
        }
      }
      var fires = e.doclet.fires;
      var event;
      if (fires) {
        for (i = 0, ii = fires.length; i < ii; ++i) {
          event = fires[i].split(' ').pop();
          name = event.replace('event:', '');
          if (api.indexOf(name) === -1) {
            unexported.push(name);
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
      e.doclet.undocumented = (api.indexOf(fqn) === -1 && unexported.indexOf(fqn) === -1);
      e.doclet.unexported = (unexported.indexOf(fqn) !== -1);
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
