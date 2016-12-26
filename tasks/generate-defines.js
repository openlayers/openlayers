var fs = require('fs');
var path = require('path');
var esprima = require('esprima');

var mainPath = path.join(__dirname, '..', 'src', 'ol', 'index.js');
var mainSource = fs.readFileSync(mainPath, 'utf8');
var definesPath = path.join(__dirname, '..', 'build', 'defines.json');

function isDefineLikeStatement(statement) {
  return statement.type === 'ExpressionStatement' &&
      statement.expression && statement.expression.type === 'AssignmentExpression' &&
      statement.expression.left.type === 'MemberExpression' &&
      statement.expression.right.type === 'Literal' &&
      statement.leadingComments;
}

var ast = esprima.parse(mainSource, {attachComment: true});
var defines = {};
ast.body.forEach(function(statement) {
  if (isDefineLikeStatement(statement)) {
    var comment = statement.leadingComments[statement.leadingComments.length - 1].value;
    if (comment.indexOf('* @define {') >= 0) {
      var expression = statement.expression;
      var name = expression.left.object.name + '.' + expression.left.property.name;
      var value = expression.right.value;
      defines[name] = value;
    }
  }
});

fs.writeFileSync(definesPath, JSON.stringify(defines, null, 2));
