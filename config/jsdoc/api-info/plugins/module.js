/**
 * This plugin adds an `exportMap` property to @module doclets. Each export map
 * is an object with properties named like the local identifier and values named
 * like the exported identifier.
 *
 * For example, the code below
 *
 *     export {foo as bar};
 *
 * would be a map like `{foo: 'bar'}`.
 *
 * In the case of an export declaration with a source, the export identifier is
 * prefixed by the source.  For example, this code
 *
 *     export {foo as bar} from 'ol/bam';
 *
 * would be a map like `{'ol/bam foo': 'bar'}`.
 *
 * If a default export is a literal or object expression, the local name will be
 * an empty string.  For example
 *
 *     export default {foo: 'bar'};
 *
 * would be a map like `{'': 'default'}`.
 */
const assert = require('assert');
const path = require('path');


/**
 * A lookup of export maps per source filepath.
 */
const exportMapLookup = {};

function loc(filepath, node) {
  return `${filepath}:${node.loc.start.line}`;
}

function nameFromChildIdentifier(filepath, node) {
  assert.ok(node.id, `expected identifer in ${loc(filepath, node)}`);
  assert.strictEqual(node.id.type, 'Identifier', `expected identifer in ${loc(filepath, node)}`);
  return node.id.name;
}

function handleExportNamedDeclaration(filepath, node) {
  if (!(filepath in exportMapLookup)) {
    exportMapLookup[filepath] = {};
  }
  const exportMap = exportMapLookup[filepath];

  const declaration = node.declaration;
  if (declaration) {
    // `export class Foo{}` or `export function foo() {}`
    if (declaration.type === 'ClassDeclaration' || declaration.type === 'FunctionDeclaration') {
      const name = nameFromChildIdentifier(filepath, declaration);
      exportMap[name] = name;
      return;
    }

    // `export const foo = 'bar', bam = 42`
    if (declaration.type === 'VariableDeclaration') {
      const declarations = declaration.declarations;
      assert.ok(declarations.length > 0, `expected variable declarations in ${loc(filepath, declaration)}`);
      for (const declarator of declarations) {
        assert.strictEqual(declarator.type, 'VariableDeclarator', `unexpected "${declarator.type}" in ${loc(filepath, declarator)}`);
        const name = nameFromChildIdentifier(filepath, declarator);
        exportMap[name] = name;
      }
      return;
    }

    throw new Error(`Unexpected named export "${declaration.type}" in ${loc(filepath, declaration)}`);
  }

  let prefix = '';
  const source = node.source;
  if (source) {
    // `export foo from 'bar'`
    assert.strictEqual(source.type, 'Literal', `unexpected export source "${source.type}" in ${loc(filepath, source)}`);
    prefix = `${source.value} `;
  }

  const specifiers = node.specifiers;
  assert.ok(specifiers.length > 0, `expected export specifiers in ${loc(filepath, node)}`);
  // `export {foo, bar}` or `export {default as Foo} from 'bar'`
  for (const specifier of specifiers) {
    assert.strictEqual(specifier.type, 'ExportSpecifier', `unexpected export specifier in ${loc(filepath, specifier)}`);

    const local = specifier.local;
    assert.strictEqual(local.type, 'Identifier', `unexpected local specifier "${local.type} in ${loc(filepath, local)}`);

    const exported = specifier.exported;
    assert.strictEqual(local.type, 'Identifier', `unexpected exported specifier "${exported.type} in ${loc(filepath, exported)}`);

    exportMap[prefix + local.name] = exported.name;
  }
}

function handleDefaultDeclaration(filepath, node) {
  if (!(filepath in exportMapLookup)) {
    exportMapLookup[filepath] = {};
  }
  const exportMap = exportMapLookup[filepath];

  const declaration = node.declaration;
  if (declaration) {
    // `export default class Foo{}` or `export default function foo () {}`
    if (declaration.type === 'ClassDeclaration' || declaration.type === 'FunctionDeclaration') {
      const name = nameFromChildIdentifier(filepath, declaration);
      exportMap[name] = 'default';
      return;
    }

    // `export default foo`
    if (declaration.type === 'Identifier') {
      exportMap[declaration.name] = 'default';
      return;
    }

    // `export default {foo: 'bar'}` or `export default 42`
    if (declaration.type === 'ObjectExpression' || declaration.type === 'Literal') {
      exportMap[''] = 'default';
      return;
    }
  }

  throw new Error(`Unexpected default export "${declaration.type}" in ${loc(filepath, declaration)}`);
}

exports.astNodeVisitor = {
  visitNode: (node, event, parser, filepath) => {
    if (node.type === 'ExportNamedDeclaration') {
      return handleExportNamedDeclaration(filepath, node);
    }

    if (node.type === 'ExportDefaultDeclaration') {
      return handleDefaultDeclaration(filepath, node);
    }
  }
};

const moduleLookup = {};

exports.handlers = {

  // create a lookup of @module doclets
  newDoclet: event => {
    const doclet = event.doclet;
    if (doclet.kind === 'module') {
      const filepath = path.join(doclet.meta.path, doclet.meta.filename);

      assert.ok(!(filepath in moduleLookup), `duplicate @module doc in ${filepath}`);
      moduleLookup[filepath] = doclet;
    }
  },

  // assign the `exportMap` property to @module doclets
  parseComplete: event => {
    for (const filepath in moduleLookup) {
      assert.ok(filepath in exportMapLookup, `missing ${filepath} in export map lookup`);
      moduleLookup[filepath].exportMap = exportMapLookup[filepath];
    }

    // make sure there was a @module doclet for each export map
    for (const filepath in exportMapLookup) {
      assert.ok(filepath in moduleLookup, `missing @module doclet in ${filepath}`);
    }
  }

};
