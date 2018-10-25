const path = require('path');
const fs = require('fs');

const importRegEx = /(typeof )?import\("([^"]*)"\)\.([^ \.\|\}><,\)=\n]*)([ \.\|\}><,\)=\n])/g;
const typedefRegEx = /@typedef \{[^\}]*\} ([^ \r?\n?]*)/;

const defaultExports = {};
const fileNodes = {};

function getDefaultExportName(moduleId, parser) {
  if (!defaultExports[moduleId]) {
    if (!fileNodes[moduleId]) {
      const classDeclarations = {};
      const absolutePath = path.join(process.cwd(), 'src', moduleId + '.js');
      const file = fs.readFileSync(absolutePath, 'UTF-8');
      const node = fileNodes[moduleId] = parser.astBuilder.build(file, absolutePath);
      if (node.program && node.program.body) {
        const nodes = node.program.body;
        for (let i = 0, ii = nodes.length; i < ii; ++i) {
          const node = nodes[i];
          if (node.type === 'ClassDeclaration') {
            classDeclarations[node.id.name] = node;
          } else if (node.type === 'ExportDefaultDeclaration') {
            const classDeclaration = classDeclarations[node.declaration.name];
            if (classDeclaration) {
              defaultExports[moduleId] = classDeclaration.id.name;
            }
          }
        }
      }
    }
  }
  if (!defaultExports[moduleId]) {
    defaultExports[moduleId] = '';
  }
  return defaultExports[moduleId];
}

exports.astNodeVisitor = {

  visitNode: function(node, e, parser, currentSourceName) {
    if (node.type === 'File') {
      const modulePath = path.relative(path.join(process.cwd(), 'src'), currentSourceName).replace(/\.js$/, '');
      fileNodes[modulePath] = node;
      const identifiers = {};
      if (node.program && node.program.body) {
        const nodes = node.program.body;
        for (let i = 0, ii = nodes.length; i < ii; ++i) {
          let node = nodes[i];
          if (node.type === 'ExportNamedDeclaration' && node.declaration) {
            node = node.declaration;
          }
          if (node.type === 'ImportDeclaration') {
            node.specifiers.forEach(specifier => {
              let defaultImport = false;
              switch (specifier.type) {
                case 'ImportDefaultSpecifier':
                  defaultImport = true;
                  // fallthrough
                case 'ImportSpecifier':
                  identifiers[specifier.local.name] = {
                    defaultImport,
                    value: node.source.value
                  };
                  break;
                default:
              }
            });
          } else if (node.type === 'ClassDeclaration') {
            if (node.id && node.id.name) {
              identifiers[node.id.name] = {
                value: path.basename(currentSourceName)
              };
            }

            // Add class inheritance information because JSDoc does not honor
            // the ES6 class's `extends` keyword
            if (node.superClass && node.leadingComments) {
              const leadingComment = node.leadingComments[node.leadingComments.length - 1];
              const lines = leadingComment.value.split(/\r?\n/);
              lines.push(lines[lines.length - 1]);
              const identifier = identifiers[node.superClass.name];
              if (identifier) {
                const absolutePath = path.resolve(path.dirname(currentSourceName), identifier.value);
                const moduleId = path.relative(path.join(process.cwd(), 'src'), absolutePath).replace(/\.js$/, '');
                const exportName = identifier.defaultImport ? getDefaultExportName(moduleId, parser) : node.superClass.name;
                lines[lines.length - 2] = ' * @extends ' + `module:${moduleId}${exportName ? '~' + exportName : ''}`;
              } else {
                lines[lines.length - 2] = ' * @extends ' + node.superClass.name;
              }
              leadingComment.value = lines.join('\n');
            }

          }
        }
      }
      if (node.comments) {
        node.comments.forEach(comment => {
          //TODO Handle typeof, to indicate that a constructor instead of an
          // instance is needed.
          comment.value = comment.value.replace(/typeof /g, '');

          // Convert `import("path/to/module").export` to
          // `module:path/to/module~Name`
          let importMatch;
          while ((importMatch = importRegEx.exec(comment.value))) {
            importRegEx.lastIndex = 0;
            const rel = path.resolve(path.dirname(currentSourceName), importMatch[2]);
            const importModule = path.relative(path.join(process.cwd(), 'src'), rel).replace(/\.js$/, '');
            const exportName = importMatch[3] === 'default' ? getDefaultExportName(importModule, parser) : importMatch[3];
            const replacement = `module:${importModule}${exportName ? '~' + exportName : ''}`;
            comment.value = comment.value.replace(importMatch[0], replacement + importMatch[4]);
          }

          // Treat `@typedef`s like named exports
          const typedefMatch = comment.value.replace(/\r?\n?\s*\*\s/g, ' ').match(typedefRegEx);
          if (typedefMatch) {
            identifiers[typedefMatch[1]] = {
              value: path.basename(currentSourceName)
            };
          }

          // Replace local types with the full `module:` path
          Object.keys(identifiers).forEach(key => {
            const regex = new RegExp(`(@fires |[\{<\|,] ?)${key}`, 'g');
            if (regex.test(comment.value)) {
              const identifier = identifiers[key];
              const absolutePath = path.resolve(path.dirname(currentSourceName), identifier.value);
              const moduleId = path.relative(path.join(process.cwd(), 'src'), absolutePath).replace(/\.js$/, '');
              const exportName = identifier.defaultImport ? getDefaultExportName(moduleId, parser) : key;
              comment.value = comment.value.replace(regex, '$1' + `module:${moduleId}${exportName ? '~' + exportName : ''}`);
            }
          });
        });
      }
    }
  }

};
