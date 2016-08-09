'use strict';

const util = require('./util');

/**
 * Unfortunately fragile RegExp to follow.  Here is the logic:
 *
 * 1. check if a name looks like a const (ol.foo.BOO_HOO must have a "_")
 *   if so, require the "namespace" (ol.foo)
 * 2. check if a name looks like a class (ol.foo.Bar or ol.foo.XYZ)
 *   if so, require the class (ol.foo.Bar)
 * 3. otherwise, lop off the last part of a name and require the rest
 *   (e.g. ol.foo.bar would require ol.foo)
 */

const CONST_RE = /^(ol(\.[a-z]\w*)*)\.[A-Z]+_([_A-Z])+$/;
const CLASS_RE = /^(ol(\.[a-z]\w*)*\.[A-Z]\w*)(\.\w+)*$/;

exports.rule = {
  meta: {
    docs: {
      description: 'ensure there are goog.require() calls for all used symbols'
    },
    fixable: 'code'
  },

  create: function(context) {
    const defined = {};

    return {

      ExpressionStatement: function(statement) {
        if (util.isRequireStatement(statement) || util.isProvideStatement(statement)) {
          const expression = statement.expression;
          const arg = expression.arguments[0];
          if (!arg || !arg.value) {
            return;
          }
          defined[arg.value] = true;
        }
      },

      MemberExpression: function(expression) {
        const parent = expression.parent;
        if (parent.type !== 'MemberExpression') {
          const name = util.getName(expression);
          if (name && name.startsWith('ol.')) {
            // check if the name looks like a const
            let match = name.match(CONST_RE);
            if (match) {
              if (!defined[match[1]]) {
                context.report(expression, `Missing goog.require('${match[1]}')`);
              }
              return;
            }
            // check if the name looks like a class
            match = name.match(CLASS_RE);
            if (match) {
              const className = match[1];
              const parts = className.split('.');
              const lastPart = parts[parts.length - 1];
              if (lastPart.toUpperCase() === lastPart) {
                // unfortunately ambiguous:
                // ol.has.WEBGL -> require('ol.has')
                // ol.source.XYZ -> require('ol.source.XYZ')
                const objectName = parts.slice(0, -1).join('.');
                if (!defined[className] && !defined[objectName]) {
                  context.report(expression, `Missing goog.require('${className}') or goog.require('${objectName}')`);
                }
                return;
              }
              if (!defined[className]) {
                context.report(expression, `Missing goog.require('${className}')`);
              }
              return;
            }
            // otherwise, assume the object should be required
            const parts = name.split('.');
            parts.pop();
            const objectName = parts.join('.');
            if (!defined[objectName]) {
              context.report(expression, `Missing goog.require('${objectName}')`);
            }
          }
        }
      }

    };
  }
};
