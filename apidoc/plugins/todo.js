var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('todo', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      var parts = tag.text.split(' ');
      if (parts[0] === 'stability') {
        doclet.stability = parts.slice(1).join(' ');
      } else if (parts[0] === 'observable') {
        if (!doclet.observables) {
          doclet.observables = [];
        }
        var readonly = parts.length > 3 && parts[3] === 'readonly';
        var description = (readonly ? parts.slice(4) : parts.slice(3)).join(' ');
        doclet.observables.push({
          name: parts[1],
          type: {
            names: tag.value.type.names
          },
          description: description,
          readonly: readonly
        });
      }
    }
  });
};
