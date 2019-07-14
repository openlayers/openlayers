/**
 * Define an @api tag
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function(dictionary) {
  dictionary.defineTag('api', {
    mustHaveValue: false,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      includeTypes(doclet);
      doclet.stability = 'stable';
    }
  });
};


/*
 * Based on @api annotations, and assuming that items with no @api annotation
 * should not be documented, this plugin removes undocumented symbols
 * from the documentation.
 */

const api = [];
const classes = {};
const types = {};
const modules = {};

function hasApiMembers(doclet) {
  return doclet.longname.split('#')[0] == this.longname;
}

function includeAugments(doclet) {
  // Make sure that `observables` and `fires` are taken from an already processed `class` doclet.
  // This is necessary because JSDoc generates multiple doclets with the same longname.
  const cls = classes[doclet.longname];
  if (cls.observables && !doclet.observables) {
    doclet.observables = cls.observables;
  }
  if (doclet.fires && cls.fires) {
    for (let i = 0, ii = cls.fires.length; i < ii; ++i) {
      const fires = cls.fires[i];
      if (doclet.fires.indexOf(fires) == -1) {
        doclet.fires.push(fires);
      }
    }
  }
  if (cls.fires && !doclet.fires) {
    doclet.fires = cls.fires;
  }

  const augments = doclet.augments;
  if (augments) {
    let cls;
    for (let i = augments.length - 1; i >= 0; --i) {
      cls = classes[augments[i]];
      if (cls) {
        includeAugments(cls);
        if (cls.fires) {
          if (!doclet.fires) {
            doclet.fires = [];
          }
          cls.fires.forEach(function(f) {
            if (doclet.fires.indexOf(f) == -1) {
              doclet.fires.push(f);
            }
          });
        }
        if (cls.observables) {
          if (!doclet.observables) {
            doclet.observables = [];
          }
          cls.observables.forEach(function(f) {
            if (doclet.observables.indexOf(f) == -1) {
              doclet.observables.push(f);
            }
          });
        }
        cls._hideConstructor = true;
        if (!cls.undocumented) {
          cls._documented = true;
        }
      }
    }
  }
}

function extractTypes(item) {
  item.type.names.forEach(function(type) {
    const match = type.match(/^(.*<)?([^>]*)>?$/);
    if (match) {
      modules[match[2]] = true;
      types[match[2]] = true;
    }
  });
}

function includeTypes(doclet) {
  if (doclet.params) {
    doclet.params.forEach(extractTypes);
  }
  if (doclet.returns) {
    doclet.returns.forEach(extractTypes);
  }
  if (doclet.properties) {
    doclet.properties.forEach(extractTypes);
  }
  if (doclet.type && doclet.meta.code.type == 'MemberExpression') {
    extractTypes(doclet);
  }
}

exports.handlers = {

  newDoclet: function(e) {
    const doclet = e.doclet;
    if (doclet.stability) {
      modules[doclet.longname.split(/[~\.]/).shift()] = true;
      api.push(doclet);
    }
    if (doclet.kind == 'class') {
      modules[doclet.longname.split(/[~\.]/).shift()] = true;
      if (!(doclet.longname in classes)) {
        classes[doclet.longname] = doclet;
      } else if ('augments' in doclet) {
        classes[doclet.longname].augments = doclet.augments;
      }
    }
    if (doclet.name === doclet.longname && !doclet.memberof) {
      // Make sure anonymous default exports are documented
      doclet.setMemberof(doclet.longname);
    }
  },

  parseComplete: function(e) {
    const doclets = e.doclets;
    for (let i = doclets.length - 1; i >= 0; --i) {
      const doclet = doclets[i];
      if (doclet.stability) {
        if (doclet.kind == 'class') {
          includeAugments(doclet);
        }
        if (doclet.fires) {
          doclet.fires.sort(function(a, b) {
            return a.split(/#?event:/)[1] < b.split(/#?event:/)[1] ? -1 : 1;
          });
        }
        if (doclet.observables) {
          doclet.observables.sort(function(a, b) {
            return a.name < b.name ? -1 : 1;
          });
        }
        // Always document namespaces and items with stability annotation
        continue;
      }
      if (doclet.kind == 'module' && doclet.longname in modules) {
        // Document all modules that are referenced by the API
        continue;
      }
      if (doclet.isEnum || doclet.kind == 'typedef') {
        continue;
      }
      if (doclet.kind == 'class' && api.some(hasApiMembers, doclet)) {
        // Mark undocumented classes with documented members as unexported.
        // This is used in ../template/tmpl/container.tmpl to hide the
        // constructor from the docs.
        doclet._hideConstructor = true;
        includeAugments(doclet);
      } else if (!doclet._hideConstructor && !(doclet.kind == 'typedef' && doclet.longname in types)) {
        // Remove all other undocumented symbols
        doclet.undocumented = true;
      }
      if (doclet._documented) {
        delete doclet.undocumented;
      }
    }
  }

};
