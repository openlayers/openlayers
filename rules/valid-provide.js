'use strict';

const path = require('path');
const util = require('./util');

const sourceRoot = path.join(__dirname, '..', 'src');

exports.rule = {
  meta: {
    docs: {
      description: 'require the first goog.provide() has an arg named like the file path'
    }
  },

  create: function(context) {
    let gotFirst = false;
    return {
      CallExpression: function(expression) {
        if (gotFirst) {
          return;
        }
        if (util.isProvideExpression(expression)) {
          gotFirst = true;
          const parent = expression.parent;
          if (parent.type !== 'ExpressionStatement') {
            return context.report(expression, 'Expected goog.provide() to in an expression statement');
          }

          if (parent.parent.type !== 'Program') {
            return context.report(expression, 'Expected goog.provide() to be at the top level');
          }

          if (expression.arguments.length !== 1) {
            return context.report(expression, 'Expected one argument for goog.require()');
          }

          const arg = expression.arguments[0];
          if (arg.type !== 'Literal' || !arg.value || typeof arg.value !== 'string') {
            return context.report(expression, 'Expected goog.require() to be called with a string');
          }

          const filePath = path.relative(sourceRoot, context.getFilename());
          let ext;
          if (path.basename(filePath) === 'index.js') {
            ext = path.sep + 'index.js';
          } else {
            ext = '.js';
          }
          const name = arg.value;
          const expectedPath = name.split('.').join(path.sep) + ext;
          if (expectedPath.toLowerCase() !== filePath.toLowerCase()) {
            return context.report(expression, `Expected goog.provide('${name}') to be like ${filePath}`);
          }
        }
      }
    };
  }
};
