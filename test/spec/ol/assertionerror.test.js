import {VERSION} from '../../../src/ol/util.js';
import AssertionError from '../../../src/ol/AssertionError.js';

describe('ol.AssertionError', () => {
  test('generates an error', () => {
    const error = new AssertionError(42);
    expect(error).toBeInstanceOf(Error);
  });

  test('generates a message with a versioned url', () => {
    const error = new AssertionError(42);
    const path = VERSION ? VERSION.split('-')[0] : 'latest';
    expect(error.message).toBe(
      'Assertion failed. See https://openlayers.org/en/' + path + '/doc/errors/#42 for details.'
    );
  });

  test('has an error code', () => {
    const error = new AssertionError(42);
    expect(error.code).toBe(42);
  });

  test('has a name', () => {
    const error = new AssertionError(42);
    expect(error.name).toBe('AssertionError');
  });

  test('is instanceof Error and AssertionError', () => {
    const error = new AssertionError(42);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AssertionError).toBe(true);
  });

});
