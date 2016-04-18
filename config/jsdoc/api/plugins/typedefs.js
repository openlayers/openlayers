/*
 * Converts olx.js @type annotations into properties of the previous @typedef.
 * Changes @enum annotations into @typedef.
 */

var lastOlxTypedef = null;
var olxTypes = {};
// names of the olx typenames
var olxTypeNames = [];
// types that are undefined or typedefs containing undefined
var undefinedLikes = null;

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

/**
 * Changes the description of the param, if it is found to be a required
 * option of an olxTypeName.
 */
function markRequiredIfNeeded(doclet){
  var memberof = doclet.memberof;
  // only check doclets that belong to an olxTypeName
  if (!memberof || olxTypeNames.indexOf(memberof) == -1) {
    return doclet;
  }

  var types = doclet.type.names;
  var isRequiredParam = true;

  // iterate over all types that are like-undefined (see above for explanation)
  for (var idx = undefinedLikes.length - 1; idx >= 0; idx--) {
    var undefinedLike = undefinedLikes[idx];
    // … if the current types contains a type that is undefined-like,
    // it is not required.
    if (types.indexOf(undefinedLike) != -1) {
      isRequiredParam = false;
    }
  }

  if (isRequiredParam) {
    var reqSnippet = '<span class="required-option">Required.</span></p>';
    var endsWithP = /<\/p>$/i;
    var description = doclet.description;
    if (description && endsWithP.test(description)) {
      description = description.replace(endsWithP, ' ' + reqSnippet);
    } else if (doclet.description === undefined) {
      description = '<p>' + reqSnippet;
    }
    doclet.description = description;
  }
  return doclet;
}

/**
 * Iterates over all doclets and finds the names of types that contain
 * undefined. Stores the names in the global variable undefinedLikes, so
 * that e.g. markRequiredIfNeeded can use these.
 */
function findTypesLikeUndefined(doclets) {
  undefinedLikes = ['undefined']; // include type 'undefined' explicitly
  for (var i = doclets.length - 1; i >= 0; --i) {
    var doclet = doclets[i];
    if(doclet.kind === 'typedef') {
      var types = doclet.type.names;
      if (types.indexOf('undefined') !== -1) {
        // the typedef contains 'undefined', so it self is undefinedLike.
        undefinedLikes.push(doclet.longname);
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
        olxTypeNames.push(doclet.longname);
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
    findTypesLikeUndefined(doclets);
    for (var i = doclets.length - 1; i >= 0; --i) {
      var doclet = doclets[i];
      var params = doclet.params;
      if (params) {
        addSubparams(params);
      }
      markRequiredIfNeeded(doclet);
    }
  }

};
