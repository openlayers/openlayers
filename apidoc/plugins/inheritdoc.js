/*
 * This is a hack to prevent inheritDoc and override tags from entirely removing
 * documentation of the method that inherits the documentation.
 *
 * TODO: Remove this hack when https://github.com/jsdoc3/jsdoc/issues/53
 * is addressed.
 */
exports.nodeVisitor = {

  visitNode: function(node, e, parser, currentSourceName) {
    if (/@(inheritDoc|override)(\n|\r)/.test(e.comment)) {
      e.preventDefault = true;
    }
  }

};