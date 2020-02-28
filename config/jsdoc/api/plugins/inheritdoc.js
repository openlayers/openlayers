/*
 * This is a hack to prevent inheritDoc tags from entirely removing
 * documentation of the method that inherits the documentation.
 */

exports.defineTags = function(dictionary) {
  dictionary.defineTag('inheritDoc', {
    mustNotHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      doclet.inheritdoc = true;
    }
  });
};


const lookup = {};
const incompleteByClass = {};
const keepKeys = ['comment', 'meta', 'name', 'memberof', 'longname', 'augment',
  'stability'];

exports.handlers = {

  newDoclet: function(e) {
    const doclet = e.doclet;
    let incompletes;
    if (!(doclet.longname in lookup)) {
      lookup[doclet.longname] = [];
    }
    lookup[doclet.longname].push(doclet);
    if (doclet.inheritdoc) {
      if (!(doclet.memberof in incompleteByClass)) {
        incompleteByClass[doclet.memberof] = [];
      }
      incompletes = incompleteByClass[doclet.memberof];
      if (incompletes.indexOf(doclet.name) == -1) {
        incompletes.push(doclet.name);
      }
    }
  },

  parseComplete: function(e) {
    let ancestors, candidate, candidates, doclet, i, j, k, l, key;
    let stability, incomplete, incompletes;
    const doclets = e.doclets;
    for (i = doclets.length - 1; i >= 0; --i) {
      doclet = doclets[i];
      incompletes = incompleteByClass[doclet.longname];
      if (!doclet.augments || !incompletes) {
        continue;
      }
      ancestors = doclet.augments.slice();
      // collect ancestors from the whole hierarchy
      for (j = 0; j < ancestors.length; ++j) {
        candidates = lookup[ancestors[j]];
        if (candidates) {
          for (k = candidates.length - 1; k >= 0; --k) {
            candidate = candidates[k];
            if (candidate.augments) {
              Array.prototype.push.apply(ancestors, candidate.augments);
            }
          }
        }
      }
      // walk through all inheritDoc members
      let incompleteDoclet;
      for (j = incompletes.length - 1; j >= 0; --j) {
        incomplete = incompletes[j];
        candidates = lookup[doclet.longname + '#' + incomplete];
        if (candidates) {
          // get the incomplete doclet that needs to be augmented
          for (k = candidates.length - 1; k >= 0; --k) {
            incompleteDoclet = candidates[k];
            if (incompleteDoclet.inheritdoc) {
              break;
            }
          }
        }
        // find the documented ancestor
        for (k = ancestors.length - 1; k >= 0; --k) {
          candidates = lookup[ancestors[k] + '#' + incomplete];
          if (candidates) {
            for (l = candidates.length - 1; l >= 0; --l) {
              candidate = candidates[l];
              if (candidate && !candidate.inheritdoc) {
                stability = candidate.stability || incompleteDoclet.stability;
                if (stability) {
                  incompleteDoclet.stability = stability;
                  for (key in candidate) {
                    if (candidate.hasOwnProperty(key) &&
                      keepKeys.indexOf(key) == -1) {
                      incompleteDoclet[key] = candidate[key];
                    }
                  }
                  // We have found a matching parent doc and applied it so we
                  // don't want to ignore this doclet anymore.
                  incompleteDoclet.ignore = false;
                  // We found a match so we can stop break
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

};
