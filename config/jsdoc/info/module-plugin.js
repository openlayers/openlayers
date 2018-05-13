const path = require('path');

const exportLookup = {};
const moduleLookup = {};

const MODULE_PATH = /^module:(.*)~(\w+)$/;

/**
 * Add exports to modules.
 */
exports.handlers = {

  symbolFound(event) {
    const filename = event.filename;
    const node = event.astnode;
    let local, exported;
    switch (node.type) {

      case 'ExportDefaultDeclaration': {
        exported = 'default';

        switch (node.declaration.type) {

          case 'Identifier': {
            // export default foo;
            local = node.declaration.name;
            break;
          }

          case 'FunctionDeclaration': {
            if (!node.declaration.id) {
              // export default function() {}
              local = '';
            } else {
              // export default function foo() {}
              local = node.declaration.id.name;
            }
            break;
          }

          default: {
            local = '';
          }
        }
        break;
      }

      case 'ExportNamedDeclaration': {
        if (!node.declaration) {
          // export {foo}
          // export {foo as bar}
          // handled below in ExportSpecifier
          return;
        }

        switch (node.declaration.type) {
          case 'FunctionDeclaration': {
            if (!node.declaration.id) {
              throw new Error(`Expected function declaration to have an id in ${filename}`);
            }
            const name = node.declaration.id.name;
            local = name;
            exported = name;
            break;
          }
          default: {
            return;
          }
        }
        break;
      }

      case 'ExportSpecifier': {
        if (node.exported.type === 'Identifier') {
          exported = node.exported.name;
          if (node.local.type === 'Identifier') {
            local = node.local.name;
            if (node.parent.source) {
              const resolved = path.resolve(path.dirname(filename), node.parent.source.value);
              local = `module:${resolved}~${local}`;
            }
          } else {
            local = '';
          }
        } else {
          return;
        }
        break;
      }

      default: {
        return;
      }
    }
    if (!(filename in exportLookup)) {
      exportLookup[filename] = {};
    }
    const exports = exportLookup[filename];
    if (exports.hasOwnProperty(exported)) {
      throw new Error(`Duplicate export {${local} as ${exported}} in ${filename}`);
    }
    exports[exported] = local;
  },

  newDoclet(event) {
    const doclet = event.doclet;
    if (doclet.kind === 'module') {
      const filepath = path.join(doclet.meta.path, doclet.meta.filename);
      if (filepath in moduleLookup) {
        throw new Error(`Duplicate @module annotation in ${filepath}`);
      }
      moduleLookup[filepath] = doclet;
    }
  },

  parseComplete(event) {
    for (const filepath in moduleLookup) {
      const doclet = moduleLookup[filepath];
      const exports = exportLookup[filepath];
      for (const exported in exports) {
        const local = exports[exported];
        const match = local.match(MODULE_PATH);
        if (match) {
          const filepath = match[1];
          const mod = moduleLookup[filepath];
          if (mod) {
            exports[exported] = `module:${mod.name}~${match[2]}`;
          }
        }
      }
      doclet.exports = exports; // undefined if no exports
    }
  }

};
