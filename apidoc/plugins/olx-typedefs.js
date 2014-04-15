/*
 * Converts olx.js @type annotations into properties of the previous @typedef.
 */

var lastOlxTypedef = null;
var olxTypes = {};

function addSubparams(params) {
  for (var j = 0, jj = params.length; j < jj; ++j) {
    var param = params[j];
    var types = param.type.names;
    for (var k = 0, kk = types.length; k < kk; ++k) {
      var name = types[k];
      if (name in olxTypes) {
        param.subparams = olxTypes[name];
        addSubparams(param.subparams);
        types[k] = 'Object';
        // TODO Do we need to support multiple object literal types per
        // param?
        break;
      }
    }
  }
}

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    if (doclet.meta.filename == 'olx.js') {
      if (doclet.kind == 'typedef') {
        lastOlxTypedef = doclet;
        olxTypes[doclet.longname] = [];
        doclet.properties = [];
      } else if (lastOlxTypedef && doclet.memberof == lastOlxTypedef.longname) {
        lastOlxTypedef.properties.push(doclet);
        olxTypes[lastOlxTypedef.longname].push(doclet);
      } else {
        lastOlxTypedef = null;
      }
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    for (var i = doclets.length - 1; i >= 0; --i) {
      var doclet = doclets[i];
      var params = doclet.params;
      if (params) {
        addSubparams(params);
      }
    }
  }

};
