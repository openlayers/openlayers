var pkg = require('../package.json');

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
  var commonDepth = 1;
  var fromLength = fromParts.length;
  while (commonDepth < fromLength - 2) {
    if (fromParts[commonDepth] === toParts[commonDepth]) {
      ++commonDepth;
    } else {
      break;
    }
  }

  var back = new Array(fromLength - commonDepth).join('../') || './';
  return back + toParts.slice(commonDepth).join('/').toLowerCase();
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

  // replace all uses of provided name with renamed identifier
  if (provide.indexOf('.') > 0) {
    root.find(j.MemberExpression, getMemberExpression(provide))
      .replaceWith(j.identifier(rename(provide)));
  } else {
    root.find(j.Identifier, {name: provide})
      .replaceWith(j.identifier(rename(provide)));
  }

  // replace goog.require()
  const requires = {};
  root.find(j.ExpressionStatement, getGoogExpressionStatement('require'))
    .replaceWith(path => {
      const name = path.value.expression.arguments[0].value;
      if (name in requires) {
        throw new Error(`Duplicate require found in ${info.path}: ${name}`);
      }
      const renamed = rename(name);
      requires[name] = renamed;
      return j.variableDeclaration('var', [
        j.variableDeclarator(j.identifier(renamed), j.callExpression(
          j.identifier('require'), [j.literal(resolve(provide, name))]
        ))
      ]);
    });

  // replace all uses of required names with renamed identifiers
  Object.keys(requires).sort().reverse().forEach(name => {
    if (name.indexOf('.') > 0) {
      root.find(j.MemberExpression, getMemberExpression(name))
        .replaceWith(j.identifier(requires[name]));
    } else {
      root.find(j.Identifier, {name: name})
        .replaceWith(j.identifier(requires[name]));
    }
  });

  // add module.exports
  root.find(j.Program).get('body').push(j.expressionStatement(
    j.assignmentExpression(
      '=',
      j.memberExpression(j.identifier('module'), j.identifier('exports')),
      j.identifier(rename(provide))
    )
  ));

  // replace any initial comments
  root.get().node.comments = comments;

  return root.toSource({quote: 'single'});
};
