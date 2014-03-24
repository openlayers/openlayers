var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('event', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      var parts = tag.text.split(' ');
      if (!doclet.events) {
        doclet.events = [];
      }
      doclet.events.push({
        name: tag.value.name,
        description: parts.slice(1).join(' ')
      });
    }
  });
};
