/**
 * @filedesc
 * Normalize module path to make no distinction between static and member at
 * the module level.
 */

exports.handlers = {

  /**
   * Adds default export to module path types without name
   * @param {Object} e Event object.
   */
  newDoclet: function(e) {
    const doclet = e.doclet;
    const module = doclet.longname.split('#').shift();
    if (module.indexOf('module:') == 0 && module.indexOf('.') !== -1) {
      doclet.longname = doclet.longname.replace(module, module.replace('.', '~'));
    }
  }

};
