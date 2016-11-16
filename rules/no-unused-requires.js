'use strict';

const util = require('./util');

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
          requireStatements[name] = statement;
        }
      },

      MemberExpression: function(node) {
        const name = util.getName(node);
        if (name in requireStatements) {
          const requiredAncestor = context.getAncestors().some(
              ancestorNode => !!requireStatements[util.getName(ancestorNode)]);
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
            const requiredAncestor = ancestors.some(
                ancestorNode => !!requireStatements[util.getName(ancestorNode)]);
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
