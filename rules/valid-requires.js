'use strict';

const util = require('./util');

exports.rule = {
  meta: {
    docs: {
      description: 'require that all goog.require() have a valid arg and appear at the top level'
    }
  },

  create: function(context) {
    return {
      CallExpression: function(expression) {
        if (util.isRequireExpression(expression)) {
          const parent = expression.parent;
          if (parent.type !== 'ExpressionStatement') {
            return context.report(expression, 'Expected goog.require() to in an expression statement');
          }

          if (parent.parent.type !== 'Program') {
            return context.report(expression, 'Expected goog.require() to be at the top level');
          }

          if (expression.arguments.length !== 1) {
            return context.report(expression, 'Expected one argument for goog.require()');
          }

          const arg = expression.arguments[0];
          if (arg.type !== 'Literal' || !arg.value || typeof arg.value !== 'string') {
            return context.report(expression, 'Expected goog.require() to be called with a string');
          }
        }
      }
    };
  }
};
