/*
 * Based on @stability annotations, and assuming that items with no @stability
 * annotation should not be documented, this plugin removes undocumented symbols
 * from the documentation. Undocumented classes with documented members get a
 * 'hideConstructur' property, which is read by the template so it can hide the
 * constructor.
 */

function hasApiMembers(doclet) {
  return doclet.longname.split('#')[0] == this.longname;
}

var api = [];

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    // Keep track of api items - needed in parseComplete to determine classes
    // with api members.
    if (doclet.stability) {
      api.push(doclet);
    }
    // Mark explicity defined namespaces - needed in parseComplete to keep
    // namespaces that we need as containers for api items.
    if (/.*\.jsdoc$/.test(doclet.meta.filename) && doclet.kind == 'namespace') {
      doclet.namespace_ = true;
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    for (var i = doclets.length - 1; i >= 0; --i) {
      var doclet = doclets[i];
      // Always document namespaces and items with stability annotation
      if (doclet.stability || doclet.namespace_) {
        continue;
      }
      if (doclet.kind == 'class' && api.some(hasApiMembers, doclet)) {
        // Mark undocumented classes with documented members as unexported.
        // This is used in ../template/tmpl/container.tmpl to hide the
        // constructor from the docs.
        doclet.hideConstructor = true;
      } else {
        // Remove all other undocumented symbols
        doclets.splice(i, 1);
      }
    }
  }

};
