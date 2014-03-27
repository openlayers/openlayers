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
      var names, name;
      var params = e.doclet.params;
      if (params) {
        for (i = 0, ii = params.length; i < ii; ++i) {
          names = params[i].type.names;
          if (names) {
            for (j = 0, jj=names.length; j < jj; ++j) {
              name = names[j];
              if (unexported.indexOf(name) === -1) {
                unexported.push(name);
              }
            }
          }
        }
      }
      var links = e.doclet.comment.match(/\{@link ([^\}]*)\}/g);
      if (links) {
        for (i=0, ii=links.length; i < ii; ++i) {
          var link = links[i].match(/\{@link (.*)\}/)[1];
          if (unexported.indexOf(link) === -1) {
            unexported.push(link);
          }
        }
      }
    }
  },
  
  parseComplete: function(e) {
    for (var j = e.doclets.length - 1; j >= 0; --j) {
      var doclet = e.doclets[j];
      if (doclet.kind == 'namespace' || doclet.kind == 'event' || doclet.fires) {
        continue;
      }
      var fqn = doclet.longname;
      if (fqn) {
        doclet.unexported = (api.indexOf(fqn) === -1 && unexported.indexOf(fqn) !== -1);
        if (api.indexOf(fqn) === -1 && unexported.indexOf(fqn) === -1) {
          e.doclets.splice(j, 1);
        }
      }
    }
  }

};
