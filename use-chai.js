/**
 * A transform for use with jscodeshift that replaces expect.js assertions with
 * assert style assertions from Chai.
 *
 * Example use on a single file:
 *
 *     git checkout -- test && jscodeshift -t use-chai.js test/spec/ol/geom
 *
 */

// expect().to
const expectTo = {
  type: 'MemberExpression',
  object: {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'expect'
    }
  },
  property: {
    type: 'Identifier',
    name: 'to'
  },
  computed: false
};

// expect().to.be
const expectToBe = {
  type: 'MemberExpression',
  object: expectTo,
  property: {
    type: 'Identifier',
    name: 'be'
  },
  computed: false
};

// expect().to.be()
const expectToBeCall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: expectToBe
  }
};

// expect().to.be.ok()
const expectToBeOkCall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: expectToBe,
      property: {
        type: 'Identifier',
        name: 'ok'
      },
      computed: false
    }
  }
};

// expect().to.equal()
const expectToEqualCall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: expectTo,
      property: {
        type: 'Identifier',
        name: 'equal'
      },
      computed: false
    }
  }
};

// expect().to.eql()
const expectToEqlCall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: expectTo,
      property: {
        type: 'Identifier',
        name: 'eql'
      },
      computed: false
    }
  }
};

// expect().to.be.an()
const expectToBeAnCall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: expectToBe,
      property: {
        type: 'Identifier',
        name: 'an'
      },
      computed: false
    }
  }
};

// expect().to.be.a()
const expectToBeACall = {
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: expectToBe,
      property: {
        type: 'Identifier',
        name: 'a'
      },
      computed: false
    }
  }
};

module.exports = function(info, api) {
  const j = api.jscodeshift;
  const root = j(info.source);

  // replace `expect(foo).to.be(bar)` with `assert.equal(foo, bar)`
  root.find(j.ExpressionStatement, expectToBeCall)
    .replaceWith(path => {
      const expected = path.value.expression.arguments[0];
      const actual = path.value.expression.callee.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('equal')), [actual, expected]
        )
      );
    });

  // replace `expect(foo).to.be.ok()` with `assert.isOk(foo)`
  root.find(j.ExpressionStatement, expectToBeOkCall)
    .replaceWith(path => {
      const actual = path.value.expression.callee.object.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('isOk')), [actual]
        )
      );
    });

  // replace `expect(foo).to.equal(bar)` with `assert.strictEqual(foo, bar)`
  root.find(j.ExpressionStatement, expectToEqualCall)
    .replaceWith(path => {
      const expected = path.value.expression.arguments[0];
      const actual = path.value.expression.callee.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('strictEqual')), [actual, expected]
        )
      );
    });

  // replace `expect(foo).to.eql(bar)` with `assert.deepEqual(foo, bar)`
  root.find(j.ExpressionStatement, expectToEqlCall)
    .replaceWith(path => {
      const expected = path.value.expression.arguments[0];
      const actual = path.value.expression.callee.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('deepEqual')), [actual, expected]
        )
      );
    });

  // replace `expect(foo).to.be.an(bar)` with `assert.instanceOf(foo, bar)`
  root.find(j.ExpressionStatement, expectToBeAnCall)
    .replaceWith(path => {
      const expected = path.value.expression.arguments[0];
      const actual = path.value.expression.callee.object.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('instanceOf')), [actual, expected]
        )
      );
    });

  // replace `expect(foo).to.be.a(bar)` with `assert.instanceOf(foo, bar)`
  root.find(j.ExpressionStatement, expectToBeACall)
    .replaceWith(path => {
      const expected = path.value.expression.arguments[0];
      const actual = path.value.expression.callee.object.object.object.arguments[0];
      return j.expressionStatement(
        j.callExpression(
          j.memberExpression(j.identifier('assert'), j.identifier('instanceOf')), [actual, expected]
        )
      );
    });

  // add the `import {assert} from 'chai';`
  const body = root.find(j.Program).get('body');
  body.unshift(
    j.importDeclaration([j.importSpecifier(j.identifier('assert'))], j.literal('chai'))
  );

  return root.toSource({quote: 'single'});
};
