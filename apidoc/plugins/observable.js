var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('observable', {
    mustHaveValue: true,
    canHaveType: true,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      if (!doclet.observables) {
        doclet.observables = [];
      }
      var description = tag.value.description;
      var readonly = description.split(' ').shift() === 'readonly';
      if (readonly) {
        description = description.split(' ').slice(1).join(' ');
      }
      doclet.observables.push({
        name: tag.value.name,
        type: {
          names: tag.value.type.names
        },
        description: description,
        readonly: readonly
      });
    }
  });
};
