

goog.require('ol');
goog.require('ol.AssertionError');

describe('ol.AssertionError', function() {
  it('generates a message', function() {
    var error = new ol.AssertionError(42);
    expect(error.message).to.be('Assertion failed. See https://openlayers.org/en/latest/doc/errors/#42 for details.');
  });

  it('generates a message with a versioned url', function() {
    var error = new ol.AssertionError(42);
    var path = ol.VERSION ? ol.VERSION.split('-')[0] : 'latest';
    expect(error.message).to.be('Assertion failed. See https://openlayers.org/en/' + path + '/doc/errors/#42 for details.');
  });

  it('has an error code', function() {
    var error = new ol.AssertionError(42);
    expect(error.code).to.be(42);
  });

  it('has a name', function() {
    var error = new ol.AssertionError(42);
    expect(error.name).to.be('AssertionError');
  });
});
