var conf = env.conf.stability;
var defaultLevels = ["deprecated","experimental","unstable","stable","frozen","locked"];
var levels = conf.levels || defaultLevels;
var util = require('util');
exports.defineTags = function(dictionary) {
  dictionary.defineTag('stability', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      var level = tag.text;
      if (levels.indexOf(level) >=0) {
        doclet.stability = level;
      } else {
        var errorText = util.format('Invalid stability level (%s) in %s line %s', tag.text, doclet.meta.filename, doclet.meta.lineno);
        require('jsdoc/util/error').handle( new Error(errorText) );
      }
    }
  })
};
