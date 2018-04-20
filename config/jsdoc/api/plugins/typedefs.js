/*
 * Changes @enum annotations into @typedef.
 */

// types that are undefined or typedefs containing undefined
let undefinedLikes = null;

/**
 * Changes the description of the param if it is required.
 * @param {Object} doclet The doclet.
 * @returns {Object} The modified doclet.
 */
function markRequiredIfNeeded(doclet) {
  const memberof = doclet.memberof;
  if (!memberof) {
    return doclet;
  }

  const types = doclet.type.names;
  let isRequiredParam = true;

  // iterate over all types that are like-undefined (see above for explanation)
  for (let idx = undefinedLikes.length - 1; idx >= 0; idx--) {
    const undefinedLike = undefinedLikes[idx];
    // … if the current types contains a type that is undefined-like,
    // it is not required.
    if (types.indexOf(undefinedLike) != -1) {
      isRequiredParam = false;
    }
  }

  if (isRequiredParam) {
    const reqSnippet = '<span class="required-option">Required.</span></p>';
    const endsWithP = /<\/p>$/i;
    let description = doclet.description;
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
 * @param {Array} doclets The doclets.
 */
function findTypesLikeUndefined(doclets) {
  undefinedLikes = ['undefined']; // include type 'undefined' explicitly
  for (let i = doclets.length - 1; i >= 0; --i) {
    const doclet = doclets[i];
    if (doclet.kind === 'typedef') {
      const types = doclet.type.names;
      if (types.indexOf('undefined') !== -1) {
        // the typedef contains 'undefined', so it self is undefinedLike.
        undefinedLikes.push(doclet.longname);
      }
    }
  }
}

exports.handlers = {

  newDoclet: function(e) {
    const doclet = e.doclet;
    if (doclet.isEnum) {
      // We never export enums, so we document them like typedefs
      doclet.kind = 'typedef';
      delete doclet.isEnum;
    }
  },

  parseComplete: function(e) {
    const doclets = e.doclets;
    findTypesLikeUndefined(doclets);
    for (let i = doclets.length - 1; i >= 0; --i) {
      markRequiredIfNeeded(doclets[i]);
    }
  }

};
