/**
 * Define an @api tag
 */
var conf = env.conf.stability;
var defaultLevels = ["deprecated","experimental","unstable","stable","frozen","locked"];
var levels = conf.levels || defaultLevels;
var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('api', {
    mustHaveValue: false,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      includeTypes(doclet);
      var level = tag.text || "experimental";
      if (levels.indexOf(level) >= 0) {
        doclet.stability = level;
      } else {
        var errorText = util.format('Invalid stability level (%s) in %s line %s', tag.text, doclet.meta.filename, doclet.meta.lineno);
        require('jsdoc/lib/jsdoc/util/error').handle( new Error(errorText) );
      }
    }
  });
};



/*
 * Based on @api annotations, and assuming that items with no @api annotation
 * should not be documented, this plugin removes undocumented symbols
 * from the documentation.
 */

var api = [];
var classes = {};
var types = {};

function hasApiMembers(doclet) {
  return doclet.longname.split('#')[0] == this.longname;
}

function includeAugments(doclet) {
  var augments = doclet.augments;
  if (augments) {
    var cls;
    for (var i = augments.length - 1; i >= 0; --i) {
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
        if (cls.longname.indexOf('oli.') !== 0) {
          cls._hideConstructor = true;
          delete cls.undocumented;
        }
      }
    }
  }
}

function extractTypes(item) {
  item.type.names.forEach(function(type) {
    var match = type.match(/^(.*<)?([^>]*)>?$/);
    if (match) {
      types[match[2]] = true;
    }
  });
}

function includeTypes(doclet) {
  if (doclet.params && doclet.kind != 'class') {
    doclet.params.forEach(extractTypes);
  }
  if (doclet.returns) {
    doclet.returns.forEach(extractTypes);
  }
  if (doclet.isEnum) {
    types[doclet.meta.code.name] = true;
  }
  if (doclet.type && doclet.meta.code.type == 'MemberExpression') {
    // types in olx.js
    extractTypes(doclet);
  }
}

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    // Keep track of api items - needed in parseComplete to determine classes
    // with api members.
    if (doclet.meta.filename == 'olx.js' && doclet.kind == 'typedef') {
      doclet.undocumented = false;
    }
    if (doclet.stability) {
      api.push(doclet);
    }
    // Mark explicity defined namespaces - needed in parseComplete to keep
    // namespaces that we need as containers for api items.
    if (/.*\.jsdoc$/.test(doclet.meta.filename) && doclet.kind == 'namespace') {
      doclet.namespace_ = true;
    }
    if (doclet.kind == 'class') {
      classes[doclet.longname] = doclet;
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    for (var i = doclets.length - 1; i >= 0; --i) {
      var doclet = doclets[i];
      if (doclet.stability || doclet.namespace_) {
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
      if (doclet.kind == 'class' && api.some(hasApiMembers, doclet)) {
        // Mark undocumented classes with documented members as unexported.
        // This is used in ../template/tmpl/container.tmpl to hide the
        // constructor from the docs.
        doclet._hideConstructor = true;
        includeAugments(doclet);
      } else if (doclet.undocumented !== false && !doclet._hideConstructor && !(doclet.kind == 'typedef' && doclet.longname in types)) {
        // Remove all other undocumented symbols
        doclet.undocumented = true;
      }
    }
  }

};
