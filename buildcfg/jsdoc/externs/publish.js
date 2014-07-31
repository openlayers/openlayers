/**
 * @fileoverview Generates a closure compiler externs file for exportable
 * symbols (those with an api tag) and boolean defines (with a define tag and a
 * default value).
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');


/**
 * Publish hook for the JSDoc template.  Writes to stdout.
 * @param {function} data The root of the Taffy DB containing doclet records.
 * @param {Object} opts Options.
 */
exports.publish = function(data, opts) {

  // get all doclets with the "api" property or define (excluding enums,
  // typedefs and events)
  var docs = data(
      [{define: {isObject: true}}, {api: {isString: true}}],
      {isEnum: {'!is': true}},
      {kind: {'!is': 'typedef'}},
      {kind: {'!is': 'event'}}).get();

  // get symbols data, filter out those that are members of private classes
  var output = [];
  var namespaces = {};
  var constructors = {};
  docs.filter(function(doc) {
    var include = true;
    var constructor = doc.memberof;
    if (constructor && constructor.substr(-1) === '_') {
      assert.strictEqual(doc.inherited, true,
          'Unexpected export on private class: ' + doc.longname);
      include = false;
    }
    return include;
  }).forEach(function(doc) {

    var parts = doc.longname.split('#')[0].split('.');
    parts.pop();
    var namespace = [];
    parts.forEach(function(part) {
      namespace.push(part);
      var partialNamespace = namespace.join('.');
      if (!(partialNamespace in namespaces)) {
        namespaces[partialNamespace] = true;
        output.push('/**');
        output.push(' * @type {Object}');
        output.push(' */');
        output.push(
            (namespace.length == 1 ? 'var ' : '') + partialNamespace + ';');
        output.push('');
      }
    });

    var signature = doc.longname;
    if (signature.indexOf('#') > 0) {
      signature = doc.longname.replace('#', '.prototype.');
      var constructor = doc.longname.split('#')[0];
      if (!(constructor in constructors)) {
        constructors[constructor] = true;
        output.push('/**');
        output.push(' * @constructor');
        output.push(' */');
        output.push(constructor + ' = function() {}');
        output.push('');
      }
    }

    output.push('/**');
    if (doc.define) {
      output.push(' * @define');
      output.push(' * @type {boolean}');
      output.push(' */');
      output.push(doc.longname + ';');
    } else {
      if (doc.kind == 'class') {
        output.push(' * @constructor');
      }
      if (doc.type) {
        var types = [];
        doc.type.names.forEach(function(name) {
          types.push(name);
        });
        output.push(' * @type {' + types.join('|') + '}');
      }
      var args = [];
      if (doc.params) {
        doc.params.forEach(function(param) {
          args.push(param.name);
          var names = [];
          param.type.names.forEach(function(name) {
            names.push(name);
          });
          output.push(' * @param {' +
              (param.variable ? '...' : '') +
              names.join('|') +
              (param.optional ? '=' : '') +
              '} ' + param.name);
        });
      }
      if (doc.returns) {
        var returnTypes = [];
        doc.returns[0].type.names.forEach(function(name) {
          returnTypes.push(name);
        });
        output.push(' * @return {' + returnTypes.join('|') + '}');
      }
      if (doc.tags) {
        doc.tags.forEach(function(tag) {
          if (tag.title == 'template') {
            output.push(' * @' + tag.title + ' ' + tag.value);
          }
        });
      }
      output.push(' */');
      if (doc.kind == 'function' || doc.kind == 'class') {
        output.push(signature + ' = function(' + args.join(', ') + ') {};');
      } else {
        output.push(signature);
      }
    }
    output.push('');
  });

  process.stdout.write(output.join('\n'));

};
