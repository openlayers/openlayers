/*
 * Converts olx.js @type annotations into properties of the previous @typedef.
 * Changes @enum annotations into @typedef.
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
        // TODO addSubparams(param.subparams);
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
      // do nothing if not marked @api
      if (!doclet.stability) {
        return;
      }
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
    } else if (doclet.isEnum) {
      // We never export enums, so we document them like typedefs
      doclet.kind = 'typedef';
      delete doclet.isEnum;
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
