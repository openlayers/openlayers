module.exports = {
  rules: {
    'no-duplicate-requires': require('./no-duplicate-requires').rule,
    'no-unused-requires': require('./no-unused-requires').rule,
    'requires-first': require('./requires-first').rule,
    'valid-requires': require('./valid-requires').rule
  }
};
