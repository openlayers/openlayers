var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('todo', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      var parts = tag.text.split(' ');
      if (parts[0] === 'observable') {
        doclet.observable = '';
      }
    }
  });
};
