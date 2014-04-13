/*
 * Converts olx.js @type annotations into properties of the previous @typedef.
 */

var olxTypedef = null;

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    if (doclet.meta.filename == 'olx.js') {
      if (doclet.kind == 'typedef') {
        olxTypedef = doclet;
        doclet.properties = [];
      } else if (olxTypedef && doclet.memberof == olxTypedef.longname) {
        olxTypedef.properties.push(doclet);
      } else {
        olxTypedef = null;
      }
    }
  }

};
