'use strict';

const util = require('./util');

exports.rule = {
  meta: {
    docs: {
      description: 'disallow duplicate goog.require() calls'
    },
    fixable: 'code'
  },

  create: function(context) {
    const alreadyRequired = {};

    return {
      ExpressionStatement: function(statement) {
        if (util.isRequireStatement(statement)) {
          const expression = statement.expression;

          if (!expression.arguments[0]) {
            return;
          }
          const name = expression.arguments[0].value;

          if (alreadyRequired[name]) {
            const source = context.getSourceCode();

            return context.report({
              node: statement,
              message: `Duplicate goog.require('${name}')`,
              fix: function(fixer) {
                const afterToken = source.getTokenAfter(statement);
                const range = [
                  statement.range[0],
                  afterToken ? afterToken.range[0] : statement.range[1]
                ];
                return fixer.removeRange(range);
              }
            });
          }
          alreadyRequired[name] = true;
        }
      }
    };
  }

};
