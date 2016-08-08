function isGoogCallExpression(node, name) {
  const callee = node.callee;
  return callee && callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' && callee.object.name === 'goog' &&
      callee.property.type === 'Identifier' && !callee.property.computed &&
      callee.property.name === name;
}

function isGoogStatement(node, name) {
  return node.expression && node.expression.type === 'CallExpression' &&
    isGoogCallExpression(node.expression, name);
}

exports.isProvideExpression = function(node) {
  return isGoogCallExpression(node, 'provide');
};

exports.isProvideStatement = function(node) {
  return isGoogStatement(node, 'provide');
};

exports.isRequireExpression = function(node) {
  return isGoogCallExpression(node, 'require');
};

exports.isRequireStatement = function(node) {
  return isGoogStatement(node, 'require');
};
