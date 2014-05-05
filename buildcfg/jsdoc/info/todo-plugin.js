/**
 * @fileoverview  This plugin should go away when we get rid of Plovr and can
 * use Closure Compiler's extra_annotation_name option.  Until then, we hijack
 * the todo tag to add doclet properties for other tags we eventually want to
 * support.  For example, the "todo api" tag can eventually be replaced with
 * the "api" tag.
 */


/**
 * Our hook to define new tags.
 * @param {Object} dictionary The tag dictionary.
 */
exports.defineTags = function(dictionary) {

  dictionary.defineTag('todo', {
    mustHaveValue: true,
    onTagged: function(doclet, tag) {
      var parts = tag.text.split(' ');
      if (parts[0] === 'api') {
        doclet.api = parts.slice(1).join(' ').trim();
      }
    }
  });

};
