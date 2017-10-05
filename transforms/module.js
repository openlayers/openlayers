const parentPackage = require('../package.json');
const thisPackage = require('../package/package.json');

const defines = {
  // Compiler defines go here, e.g.
  // 'ol.ENABLE_WEBGL': false
};

function rename(name) {
  const parts = name.split('.');
  return `_${parts.join('_')}_`;
}

function resolve(fromName, toName) {
  const fromParts = fromName.split('.');
  const toParts = toName.split('.');
  if (toParts[0] === 'ol' && toParts[1] === 'ext') {
    let name = toParts[2];
    let packageName;
    let imported;
    for (let i = 0, ii = parentPackage.ext.length; i < ii; ++i) {
      const dependency = parentPackage.ext[i];
      imported = dependency.import;
      if (dependency.module === name || dependency.name === name) {
        packageName = dependency.module;
        // ensure dependency is listed on both package.json
        if (
          !thisPackage.dependencies[packageName] ||
          thisPackage.dependencies[packageName] !== parentPackage.dependencies[packageName]
        ) {
          throw new Error(`Package ${packageName} must appear in all package.json at the same version`);
        }
        break;
      }
    }
    if (!packageName) {
      throw new Error(`Can't find package name for ${toName}`);
    }
    if (imported) {
      return [packageName, imported];
    } else {
      return packageName;
    }
  }
  if (fromParts[0] === 'examples' || fromParts[0] === 'test') {
    fromParts.unshift('root');
    toParts.unshift('root', 'src');
  }
  const fromLength = fromParts.length;
  let commonDepth = 1;
  while (commonDepth < fromLength - 2) {
    if (fromParts[commonDepth] === toParts[commonDepth]) {
      ++commonDepth;
    } else {
      break;
    }
  }

  const back = new Array(fromLength - commonDepth).join('../') || './';
  // TODO: remove .toLowerCase() after running tasks/filename-case-from-module.js
  let relative = back + toParts.slice(commonDepth).join('/').toLowerCase();
  if (relative.endsWith('/')) {
    relative += 'index';
  }
  return relative + '.js';
}

function getUnprovided(path) {
  path = path.replace(/\.(test\.)?js$/, '');
  const parts = path.split('/');
  return parts.join('.');
}

function getGoogExpressionStatement(identifier) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: 'goog'
        },
        property: {
          type: 'Identifier',
          name: identifier
        }
      }
    }
  };
}

const defineMemberExpression = {
  type: 'MemberExpression',
  object: {
    type: 'Identifier',
    name: 'ol'
  },
  property: {
    type: 'Identifier'
  }
};

function getMemberExpression(name) {
  function memberExpression(parts) {
    const dotIndex = parts.lastIndexOf('.');
    if (dotIndex > 0) {
      return {
        type: 'MemberExpression',
        object: memberExpression(parts.slice(0, dotIndex)),
        property: {
          type: 'Identifier',
          name: parts.slice(dotIndex + 1)
        }
      };
    } else {
      return {
        type: 'Identifier',
        name: parts
      };
    }
  }
  return memberExpression(name);
}

function getMemberExpressionAssignment(name) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left: getMemberExpression(name)
    }
  };
}

module.exports = function(info, api) {
  const j = api.jscodeshift;
  const root = j(info.source);

  // store any initial comments
  const {comments} = root.find(j.Program).get('body', 0).node;

  // replace `ol.VERSION = ''` with correct version
  root.find(j.ExpressionStatement, getMemberExpressionAssignment('ol.VERSION'))
      .forEach(path => {
        path.value.expression.right = j.literal('v' + thisPackage.version);
      });

  const replacements = {};

  // replace all uses of defines
  root.find(j.MemberExpression, defineMemberExpression)
      .filter(path => {
        const node = path.value;
        const name = `${node.object.name}.${node.property.name}`;
        return (name in defines) && path.parentPath.value.type !== 'AssignmentExpression';
      })
      .replaceWith(path => {
        const name = `${path.value.object.name}.${path.value.property.name}`;
        const expression = j.literal(defines[name]);
        expression.comments = path.value.comments;
        return expression;
      });

  // remove goog.provide()
  let provide, unprovided;
  root.find(j.ExpressionStatement, getGoogExpressionStatement('provide'))
      .forEach(path => {
        if (provide) {
          throw new Error(`Multiple provides in ${info.path}`);
        }
        provide = path.value.expression.arguments[0].value;
        if (provide.indexOf(' ') > -1) {
          throw new Error(`Space in provide "${provide}" in ${info.path}`);
        }
      }).remove();

  if (provide) {
    replacements[provide] = rename(provide);
    // replace provide assignment with variable declarator
    // e.g. `ol.foo.Bar = function() {}` -> `var _ol_foo_Bar_ = function() {}`
    let declaredProvide = false;
    root.find(j.ExpressionStatement, getMemberExpressionAssignment(provide))
        .replaceWith(path => {
          declaredProvide = true;
          const statement = j.variableDeclaration('var', [
            j.variableDeclarator(j.identifier(rename(provide)), path.value.expression.right)
          ]);
          statement.comments = path.value.comments;
          return statement;
        });

    if (!declaredProvide) {
      const body = root.find(j.Program).get('body');
      body.unshift(
          j.variableDeclaration('var', [
            j.variableDeclarator(j.identifier(rename(provide)), j.objectExpression([]))
          ])
      );
    }
  } else {
    unprovided = getUnprovided(info.path);
  }

  // replace `goog.require('foo')` with `import foo from 'foo'`
  const imports = [];
  root.find(j.ExpressionStatement, getGoogExpressionStatement('require'))
      .forEach(path => {
        const name = path.value.expression.arguments[0].value;
        if (name in replacements) {
          throw new Error(`Duplicate require found in ${info.path}: ${name}`);
        }
        const renamed = rename(name);
        replacements[name] = renamed;
        const resolved = resolve(provide || unprovided, name);
        let specifier, source;
        if (Array.isArray(resolved)) {
        // import {imported as renamed} from 'source';
          specifier = j.importSpecifier(j.identifier(resolved[1]), j.identifier(renamed));
          source = resolved[0];
        } else {
        // import renamed from 'source';
          specifier = j.importDefaultSpecifier(j.identifier(renamed));
          source = resolved;
        }
        imports.push(j.importDeclaration([specifier], j.literal(source)));
      })
      .remove();

  const body = root.find(j.Program).get('body');
  body.unshift.apply(body, imports);

  // replace all uses of required or provided names with renamed identifiers
  Object.keys(replacements).sort().reverse().forEach(name => {
    if (name.indexOf('.') > 0) {
      root.find(j.MemberExpression, getMemberExpression(name))
          .replaceWith(path => {
            const expression = j.identifier(replacements[name]);
            expression.comments = path.value.comments;
            return expression;
          });
    } else {
      root.find(j.Identifier, {name: name})
          .replaceWith(path => {
            const identifier = j.identifier(replacements[name]);
            identifier.comments = path.value.comments;
            return identifier;
          });
    }
  });

  // add export declaration
  if (provide) {
    root.find(j.Program).get('body').push(
        j.exportDefaultDeclaration(j.identifier(rename(provide)))
    );
  }

  // replace any initial comments
  root.get().node.comments = comments;

  // add @module annotation for src modules
  if (info.path.startsWith('src')) {
    const name = info.path.replace(/^src\//, '').replace(/\.js$/, '');
    const comment = j.commentBlock(`*\n * @module ${name}\n `);
    const node = root.get().node;
    if (!node.comments) {
      node.comments = [comment];
    } else {
      node.comments.unshift(comment);
    }
  }

  return root.toSource({quote: 'single'});
};
