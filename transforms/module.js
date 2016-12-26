const pkg = require('../package.json');
const defines = require('../build/info.json').defines;

const defineLookup = {};
defines.forEach(define => defineLookup[define.name] = define);

function rename(name) {
  const parts = name.split('.');
  return `_${parts.join('_')}_`;
}

function renameDefine(name) {
  return name.replace('.', '_').toUpperCase();
}

function resolve(fromName, toName) {
  const fromParts = fromName.split('.');
  const toParts = toName.split('.');
  if (toParts[0] === 'ol' && toParts[1] === 'ext') {
    let name = toParts[2];
    let packageName;
    for (let i = 0, ii = pkg.ext.length; i < ii; ++i) {
      const dependency = pkg.ext[i];
      if (dependency.module === name) {
        packageName = name;
        break;
      } else if (dependency.name === name) {
        packageName = dependency.module;
        break;
      }
    }
    if (!packageName) {
      throw new Error(`Can't find package name for ${toName}`);
    }
    return packageName;
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
  let relative = back + toParts.slice(commonDepth).join('/').toLowerCase();
  if (relative.endsWith('/')) {
    relative += 'index';
  }
  return relative;
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

const defineStatement = {
  type: 'ExpressionStatement',
  expression: {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: 'ol'
      },
      property: {
        type: 'Identifier'
      }
    },
    right: {
      type: 'Literal'
    }
  }
};

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

module.exports = function(info, api) {
  const j = api.jscodeshift;
  const root = j(info.source);

  // store any initial comments
  const {comments} = root.find(j.Program).get('body', 0).node;

  const replacements = {};

  // replace assignments for boolean defines (e.g. ol.FOO = true -> window.OL_FOO = true)
  root.find(j.ExpressionStatement, defineStatement)
    .filter(path => {
      const expression = path.value.expression;
      const defineName = `${expression.left.object.name}.${expression.left.property.name}`;
      return defineName in defineLookup;
    })
    .replaceWith(path => {
      const expression = path.value.expression;
      const defineName = `${expression.left.object.name}.${expression.left.property.name}`;
      const comments = path.value.comments;
      const statement = j.variableDeclaration('var', [
        j.variableDeclarator(j.identifier(renameDefine(defineName)), j.literal(expression.right.value))
      ]);
      statement.comments = comments;
      return statement;
    });

  // replace all uses of boolean defines with renamed define
  root.find(j.MemberExpression, defineMemberExpression)
    .filter(path => {
      const node = path.value;
      const defineName = `${node.object.name}.${node.property.name}`;
      return defineName in defineLookup;
    })
    .replaceWith(path => {
      return j.identifier(renameDefine(`${path.value.object.name}.${path.value.property.name}`));
    });

  // replace goog.provide()
  let provide;
  root.find(j.ExpressionStatement, getGoogExpressionStatement('provide'))
    .replaceWith(path => {
      if (provide) {
        throw new Error(`Multiple provides in ${info.path}`);
      }
      provide = path.value.expression.arguments[0].value;
      return j.variableDeclaration('var', [
        j.variableDeclarator(j.identifier(rename(provide)), j.objectExpression([]))
      ]);
    });

  if (!provide) {
    throw new Error(`No provide found in ${info.path}`);
  }
  replacements[provide] = rename(provide);

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
      imports.push(
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier(renamed))],
          j.literal(resolve(provide, name))
        )
      );
    })
    .remove();

  const body = root.find(j.Program).get('body');
  body.unshift.apply(body, imports);

  // replace all uses of required or provided names with renamed identifiers
  Object.keys(replacements).sort().reverse().forEach(name => {
    if (name.indexOf('.') > 0) {
      root.find(j.MemberExpression, getMemberExpression(name))
        .replaceWith(j.identifier(replacements[name]));
    } else {
      root.find(j.Identifier, {name: name})
        .replaceWith(j.identifier(replacements[name]));
    }
  });

  // add export declaration
  root.find(j.Program).get('body').push(
    j.exportDefaultDeclaration(j.identifier(rename(provide)))
  );

  // replace any initial comments
  root.get().node.comments = comments;

  return root.toSource({quote: 'single'});
};
