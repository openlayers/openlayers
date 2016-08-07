function isGoogRequire(node) {
  const callee = node.callee;
  return callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' && callee.object.name === 'goog' &&
      callee.property.type === 'Identifier' && !callee.property.computed && callee.property.name === 'require';
}

function getName(node) {
  if (node.type !== 'MemberExpression') {
    return;
  }
  if (node.property.type !== 'Identifier' || node.property.computed) {
    return;
  }
  let objectName;
  if (node.object.type === 'Identifier' && !node.object.computed) {
    objectName = node.object.name;
  } else if (node.object.type === 'MemberExpression' && !node.object.computed) {
    objectName = getName(node.object);
  }
  if (!objectName) {
    return;
  }
  return `${objectName}.${node.property.name}`;
}

exports.rule = {
  meta: {
    docs: {
      description: 'disallow unused goog.require() calls'
    },
    fixable: 'code',
    schema: []
  },
  create: function(context) {

    // a lookup of goog.require() nodes by argument
    const requireNodes = {};

    // used names from member expressions that match the goog.require() arg
    const usedNames = {};

    return {

      CallExpression: function(node) {

        if (isGoogRequire(node)) {
          if (node.arguments.length !== 1) {
            return context.report(node, 'Expected one argument for goog.require()');
          }
          const arg = node.arguments[0];
          if (arg.type !== 'Literal' || !arg.value || typeof arg.value !== 'string') {
            return context.report(node, 'Expected goog.require() to be called with a string');
          }
          const name = arg.value;
          if (name in requireNodes) {
            return context.report(node, `Duplicate goog.require('${name}')`);
          }
          const ancestors = context.getAncestors();
          const parent = ancestors[ancestors.length - 1];
          if (!parent || parent.type !== 'ExpressionStatement') {
            return context.report(node, 'Expected goog.require() to be in an expression statement');
          }
          requireNodes[name] = {
            expression: node,
            statement: parent
          };
        }

      },

      MemberExpression: function(node) {
        const name = getName(node);
        if (name in requireNodes) {
          const requiredAncestor = context.getAncestors().some(ancestorNode => !!requireNodes[getName(ancestorNode)]);
          if (!requiredAncestor) {
            usedNames[name] = true;
          }
        }
      },

      Identifier: function(node) {
        const name = node.name;
        if (name in requireNodes) {
          const ancestors = context.getAncestors();
          if (ancestors.length && ancestors[0].type === 'MemberExpression') {
            const requiredAncestor = context.getAncestors().some(ancestorNode => !!requireNodes[getName(ancestorNode)]);
            if (!requiredAncestor) {
              usedNames[name] = true;
            }
          } else {
            usedNames[name] = true;
          }
        }
      },

      'Program:exit': function(node) {
        const source = context.getSourceCode();
        for (let name in requireNodes) {
          if (!usedNames[name]) {
            const unusedRequire = requireNodes[name];
            context.report({
              node: unusedRequire.expression,
              message: `Unused ${source.getText(unusedRequire.expression)}`,
              fix: function(fixer) {
                const afterToken = source.getTokenAfter(unusedRequire.statement);
                const range = [
                  unusedRequire.statement.range[0],
                  afterToken ? afterToken.range[0] : unusedRequire.statement.range[1]
                ];
                return fixer.removeRange(range);
              }
            });
          }
        }
      }

    };
  }
};
