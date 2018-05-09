/**
 * @filedesc
 * Expands module path type to point to default export when no name is given
 */

const fs = require('fs');
const path = require('path');

let moduleRoot;

function addDefaultExportPath(obj) {
  if (!Array.isArray(obj)) {
    obj = obj.names;
  }
  obj.forEach((name, index) => {
    const matches = name.match(/module\:([^>|),\.<]|)+/g);
    if (matches) {
      matches.forEach(module => {
        if (!/[~\.]/.test(module)) {
          const checkFile = path.resolve(moduleRoot, module.replace(/^module\:/, ''));
          const file = fs.readFileSync(require.resolve(checkFile), 'utf-8');
          const lines = file.split('\n');
          let hasDefaultExport = false;
          for (let i = 0, ii = lines.length; i < ii; ++i) {
            hasDefaultExport = hasDefaultExport || lines[i].indexOf('export default ') == 0;
            const match = lines[i].match(/^export default ([A-Za-z_$][A-Za-z0-9_$]+);$/);
            if (match) {
              // Use variable name if default export is assigned to a variable.
              obj[index] = name.replace(module, `${module}~${match[1]}`);
              return;
            }
          }
          if (hasDefaultExport) {
            // Duplicate last part if default export is not assigned to a variable.
            obj[index] = name.replace(module, `${module}~${module.split('/').pop()}`);
          }
        }
      });
    }
  });
}

exports.handlers = {

  /**
   * Adds default export to module path types without name
   * @param {Object} e Event object.
   */
  newDoclet: function(e) {
    const doclet = e.doclet;
    if (doclet.kind == 'module') {
      const levelsUp = doclet.longname.replace(/^module\:/, '').split('/');
      if (doclet.meta.filename != 'index.js') {
        levelsUp.pop();
      }
      const pathArgs = [doclet.meta.path].concat(levelsUp.map(() => '../'));
      moduleRoot = path.resolve.apply(null, pathArgs);
    } else {
      if (doclet.augments) {
        addDefaultExportPath(doclet.augments);
      }
      if (doclet.params) {
        doclet.params.forEach(p => addDefaultExportPath(p.type));
      }
      if (doclet.returns) {
        doclet.returns.forEach(r => addDefaultExportPath(r.type));
      }
      if (doclet.properties) {
        doclet.properties.forEach(p => addDefaultExportPath(p.type));
      }
      if (doclet.type) {
        addDefaultExportPath(doclet.type);
      }
    }
  },

  /**
   * Adds `options.*` params for options that match the longname of one of the
   * collected typedefs.
   * @param {Object} e Event object.
   */
  parseComplete: function(e) {
  }

};
