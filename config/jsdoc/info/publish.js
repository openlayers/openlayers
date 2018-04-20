/**
 * @fileoverview Generates JSON output based on exportable symbols (those with
 * an api tag) and boolean defines (with a define tag and a default value).
 */
const assert = require('assert');
const path = require('path');


/**
 * Publish hook for the JSDoc template.  Writes to JSON stdout.
 * @param {function} data The root of the Taffy DB containing doclet records.
 * @param {Object} opts Options.
 * @return {Promise} A promise that resolves when writing is complete.
 */
exports.publish = function(data, opts) {

  function getTypes(data) {
    const types = [];
    data.forEach(function(name) {
      types.push(name.replace(/^function$/, 'Function'));
    });
    return types;
  }

  // get all doclets with the "api" property or define (excluding events)
  const classes = {};
  const docs = data(
    [
      {define: {isObject: true}},
      function() {
        if (this.kind == 'class') {
          if (!('extends' in this) || typeof this.api == 'boolean') {
            classes[this.longname] = this;
            return true;
          }
        }
        return (typeof this.api == 'boolean' ||
              this.meta && (/[\\\/]externs$/).test(this.meta.path));
      }
    ],
    {kind: {'!is': 'file'}},
    {kind: {'!is': 'event'}}).get();

  // get symbols data, filter out those that are members of private classes
  const symbols = [];
  const defines = [];
  const typedefs = [];
  const externs = [];
  let base = [];
  const augments = {};
  const symbolsByName = {};
  docs.filter(function(doc) {
    let include = true;
    const constructor = doc.memberof;
    if (constructor && constructor.substr(-1) === '_' && constructor.indexOf('module:') === -1) {
      assert.strictEqual(doc.inherited, true,
        'Unexpected export on private class: ' + doc.longname);
      include = false;
    }
    return include;
  }).forEach(function(doc) {
    const isExterns = (/[\\\/]externs$/).test(doc.meta.path);
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
      const symbol = {
        name: doc.longname,
        kind: doc.kind,
        description: doc.classdesc || doc.description,
        path: path.join(doc.meta.path, doc.meta.filename)
      };
      if (doc.augments) {
        symbol.extends = doc.augments[0];
      }
      if (doc.virtual) {
        symbol.virtual = true;
      }
      if (doc.type) {
        symbol.types = getTypes(doc.type.names);
      }
      if (doc.params) {
        const params = [];
        doc.params.forEach(function(param) {
          const paramInfo = {
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
          if (typeof param.nullable == 'boolean') {
            paramInfo.nullable = param.nullable;
          }
        });
        symbol.params = params;
      }
      if (doc.returns) {
        symbol.returns = {
          types: getTypes(doc.returns[0].type.names)
        };
        if (typeof doc.returns[0].nullable == 'boolean') {
          symbol.returns.nullable = doc.returns[0].nullable;
        }
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

      const target = isExterns ? externs : (doc.api ? symbols : base);
      const existingSymbol = symbolsByName[symbol.name];
      if (existingSymbol) {
        const idx = target.indexOf(existingSymbol);
        target.splice(idx, 1);
      }
      target.push(symbol);
      symbolsByName[symbol.name] = symbol;

      if (doc.api && symbol.extends) {
        while (symbol.extends in classes && !classes[symbol.extends].api &&
            classes[symbol.extends].augments) {
          symbol.extends = classes[symbol.extends].augments[0];
        }
        if (symbol.extends) {
          augments[symbol.extends] = true;
        }
      }
    }
  });

  base = base.filter(function(symbol) {
    return (symbol.name in augments || symbol.virtual);
  });

  return new Promise(function(resolve, reject) {
    process.stdout.write(
      JSON.stringify({
        symbols: symbols,
        defines: defines,
        typedefs: typedefs,
        externs: externs,
        base: base
      }, null, 2));
  });

};
