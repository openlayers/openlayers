import AssertionError from '../../../src/ol/AssertionError.js';
import expect from '../expect.js';

describe('ol/AssertionError.js', function () {
  it('generates an error', function () {
    const error = new AssertionError(42);
    expect(error).to.be.an(Error);
  });

  it('generates a message with a versioned url', function () {
    const error = new AssertionError(42);
    expect(error.message).to.be('Question unknown, the answer is 42');
  });

  it('has an error code', function () {
    const error = new AssertionError(42);
    expect(error.code).to.be(42);
  });

  it('has a name', function () {
    const error = new AssertionError(42);
    expect(error.name).to.be('AssertionError');
  });

  it('is instanceof Error and AssertionError', function () {
    const error = new AssertionError(42);
    expect(error instanceof Error).to.be(true);
    expect(error instanceof AssertionError).to.be(true);
  });
});
