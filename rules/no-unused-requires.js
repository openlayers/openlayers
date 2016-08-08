const util = require('./util');

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
    fixable: 'code'
  },

  create: function(context) {

    // a lookup of goog.require() nodes by argument
    const requireStatements = {};

    // used names from member expressions that match the goog.require() arg
    const usedNames = {};

    return {

      ExpressionStatement: function(statement) {
        if (util.isRequireStatement(statement)) {
          const expression = statement.expression;
          const arg = expression.arguments[0];
          if (!arg || !arg.value) {
            return;
          }

          const name = arg.value;
          const ancestors = context.getAncestors();
          const parent = ancestors[ancestors.length - 1];
          if (!parent) {
            return;
          }

          requireStatements[name] = statement;
        }
      },

      MemberExpression: function(node) {
        const name = getName(node);
        if (name in requireStatements) {
          const requiredAncestor = context.getAncestors().some(ancestorNode => !!requireStatements[getName(ancestorNode)]);
          if (!requiredAncestor) {
            usedNames[name] = true;
          }
        }
      },

      Identifier: function(node) {
        const name = node.name;
        if (name in requireStatements) {
          const ancestors = context.getAncestors();
          if (ancestors.length && ancestors[0].type === 'MemberExpression') {
            const requiredAncestor = context.getAncestors().some(ancestorNode => !!requireStatements[getName(ancestorNode)]);
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

        for (let name in requireStatements) {

          if (!usedNames[name]) {
            const unusedRequire = requireStatements[name];

            context.report({
              node: unusedRequire,
              message: `Unused ${source.getText(unusedRequire)}`,
              fix: function(fixer) {
                const afterToken = source.getTokenAfter(unusedRequire);
                const range = [
                  unusedRequire.range[0],
                  afterToken ? afterToken.range[0] : unusedRequire.range[1]
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
