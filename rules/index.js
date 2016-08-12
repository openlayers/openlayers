'use strict';

module.exports = {
  rules: {
    'no-duplicate-requires': require('./no-duplicate-requires').rule,
    'no-missing-requires': require('./no-missing-requires').rule,
    'no-unused-requires': require('./no-unused-requires').rule,
    'one-provide': require('./one-provide').rule,
    'requires-first': require('./requires-first').rule,
    'valid-provide': require('./valid-provide').rule,
    'valid-requires': require('./valid-requires').rule
  }
};
