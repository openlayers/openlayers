import AssertionError from '../../../src/ol/AssertionError.js';
import {VERSION} from '../../../src/ol/util.js';

describe('ol.AssertionError', function () {
  it('generates an error', function () {
    const error = new AssertionError(42);
    expect(error).to.be.an(Error);
  });

  it('generates a message with a versioned url', function () {
    const error = new AssertionError(42);
    const path = VERSION ? VERSION.split('-')[0] : 'latest';
    expect(error.message).to.be(
      'Assertion failed. See https://openlayers.org/en/' +
        path +
        '/doc/errors/#42 for details.'
    );
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
