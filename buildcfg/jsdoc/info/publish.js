/**
 * @fileoverview Generates JSON output based on exportable symbols (those with
 * an api tag) and boolean defines (with a define tag and a default value).
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');


/**
 * Publish hook for the JSDoc template.  Writes to JSON stdout.
 * @param {function} data The root of the Taffy DB containing doclet records.
 * @param {Object} opts Options.
 */
exports.publish = function(data, opts) {

  function getTypes(data) {
    var types = [];
    data.forEach(function(name) {
      types.push(name.replace(/^function$/, 'Function'));
    });
    return types;
  }

  var cwd = process.cwd();

  // get all doclets with the "api" property or define (excluding enums,
  // typedefs and events)
  var docs = data(
      [{define: {isObject: true}}, {api: {isString: true}}],
      {kind: {'!is': 'event'}}).get();

  // get symbols data, filter out those that are members of private classes
  var symbols = [];
  var defines = [];
  var typedefs = [];
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
    if (doc.define) {
      defines.push({
        name: doc.longname,
        description: doc.description,
        path: path.join(doc.meta.path, doc.meta.filename),
        default: doc.define.default
      });
    } else if (doc.kind == 'typedef' || doc.isEnum === true) {
      typedefs.push({
        name: doc.longname,
        types: getTypes(doc.type.names)
      });
    } else {
      var types;
      var symbol = {
        name: doc.longname,
        kind: doc.kind,
        description: doc.classdesc || doc.description,
        path: path.join(doc.meta.path, doc.meta.filename)
      };
      if (doc.type) {
        symbol.types = getTypes(doc.type.names);
      }
      if (doc.params) {
        var params = [];
        doc.params.forEach(function(param) {
          var paramInfo = {
            name: param.name
          };
          params.push(paramInfo);
          paramInfo.types = getTypes(param.type.names);
          if (typeof param.variable == 'boolean') {
            paramInfo.variable = param.variable;
          }
          if (typeof param.optional == 'boolean') {
            paramInfo.optional = param.optional;
          }
        });
        symbol.params = params;
      }
      if (doc.returns) {
        symbol.returns = getTypes(doc.returns[0].type.names);
      }
      if (doc.tags) {
        doc.tags.every(function(tag) {
          if (tag.title == 'template') {
            symbol.template = tag.value;
            return false;
          }
          return true;
        });
      }
      symbols.push(symbol);
    }
  });

  process.stdout.write(
      JSON.stringify({
        symbols: symbols,
        defines: defines,
        typedefs: typedefs
      }, null, 2));

};
