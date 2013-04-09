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

var types = fs.readFileSync('build/src/external/src/types.js', encoding);
collectExports(types);
var typedefs = types.match(/goog\.provide\('[^']*'\)/g);
var typedef, namespace;
for (var i = 0, ii = typedefs.length; i < ii; ++ i) {
  typedef = typedefs[i].match(/'([^']*)'/)[1];
  api.push(typedef);
  namespace = typedef.substr(0, typedef.lastIndexOf('.'));
  if (api.indexOf(namespace) === -1) {
    api.push(namespace);
  }
}


exports.handlers = {
  
  beforeParse: function(e) {
    if (/\.js$/.test(e.filename)) {
      collectExports(e.source);
    }
  },
  
  newDoclet: function(e) {
    var fqn = e.doclet.longname;
    if (fqn) {
      if (api.indexOf(fqn) === -1) {
        e.doclet.undocumented = true;
      }
    }
  }
  
};


exports.nodeVisitor = {

  visitNode: function(node, e, parser, currentSourceName) {
    if (e.code) {
      //console.log(e.source);
    }
  }
};