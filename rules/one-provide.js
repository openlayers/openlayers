'use strict';

const util = require('./util');

exports.rule = {
  meta: {
    docs: {
      description: 'disallow multiple goog.provide() calls'
    }
  },

  create: function(context) {
    let hasProvide = false;

    return {
      ExpressionStatement: function(statement) {
        if (util.isProvideStatement(statement)) {
          if (hasProvide) {
            const name = statement.expression.arguments[0].value;
            context.report(statement, `Extra goog.provide('${name}')`);
          } else {
            hasProvide = true;
          }
        }
      }
    };
  }
};
