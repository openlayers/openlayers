/*
 * This is a hack to prevent inheritDoc and override tags from entirely removing
 * documentation of the method that inherits the documentation.
 *
 * TODO: Remove this hack when https://github.com/jsdoc3/jsdoc/issues/53
 * is addressed.
 */
exports.handlers = {

  beforeParse: function(e) {
    e.source = e.source.replace(
        /\/\*\*\r?\n?\s*\* @(inheritDoc|override)\r?\n?\s*\*\/\r?\n?/g,
        "/***\n *\n */\n");
  }

};