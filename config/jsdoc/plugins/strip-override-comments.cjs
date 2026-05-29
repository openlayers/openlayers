/**
 * Strips JSDoc block comments that contain only `@override` before parsing.
 *
 * By removing these comments, we allow JSDoc's built-in augmentation process
 * to automatically detect and create inherited doclets from parent classes
 * when an overridden method is present without its own documentation.
 */
exports.handlers = {
  beforeParse: function (e) {
    // Remove JSDoc comments whose only content is @override.
    // [\s*]+ matches whitespace and the leading * characters in block comments.
    e.source = e.source.replace(/\/\*\*[\s*]+@override[\s*]+\*\//g, '');
  },
};
