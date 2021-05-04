const defaultExports = {};
const path = require('path');
const moduleRoot = path.join(process.cwd(), 'src');

// Tag default exported Identifiers because their name should be the same as the module name.
exports.astNodeVisitor = {
  visitNode: function (node, e, parser, currentSourceName) {
    if (node.parent && node.parent.type === 'ExportDefaultDeclaration') {
      const modulePath = path
        .relative(moduleRoot, currentSourceName)
        .replace(/\.js$/, '');
      const exportName =
        'module:' +
        modulePath.replace(/\\/g, '/') +
        (node.name ? '~' + node.name : '');
      defaultExports[exportName] = true;
    }
  },
};

exports.handlers = {
  processingComplete(e) {
    const byLongname = e.doclets.index.longname;
    for (const name in defaultExports) {
      if (!(name in byLongname)) {
        throw new Error(
          `missing ${name} in doclet index, did you forget a @module tag?`
        );
      }
      byLongname[name].forEach(function (doclet) {
        doclet.isDefaultExport = true;
      });
    }
  },
};
