goog.provide('ol.test.uri');

goog.require('ol.uri');


describe('ol.uri.appendParams()', function() {

  it('should append empty STYLES with =', function() {
    var url = ol.uri.appendParams('http://example.com/foo', {
      SERVICE: 'WMS',
      STYLES: ''
    });
    expect(url).to.equal('http://example.com/foo?SERVICE=WMS&STYLES=');
  });

  it('should URL encode values but not names', function() {
    var url = ol.uri.appendParams('http://example.com/foo', {
      'k ': 'v '
    });
    expect(url).to.equal('http://example.com/foo?k =v%20');
  });

  it('should append to simple base URL', function() {
    var url = ol.uri.appendParams('http://example.com/foo', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?k=v');
  });

  it('should append to base URL with ?', function() {
    var url = ol.uri.appendParams('http://example.com/foo?', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?k=v');
  });

  it('should append to base URL with single existing param', function() {
    var url = ol.uri.appendParams('http://example.com/foo?bar=bam', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?bar=bam&k=v');
  });

  it('should append to base URL with single existing param and extraneous &', function() {
    var url = ol.uri.appendParams('http://example.com/foo?bar=bam&', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?bar=bam&k=v');
  });

  it('should append to base URL with two existing params', function() {
    var url = ol.uri.appendParams('http://example.com/foo?bar=bam&baz=bat', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?bar=bam&baz=bat&k=v');
  });

  it('should append to base URL with three existing params last one empty', function() {
    var url = ol.uri.appendParams('http://example.com/foo?bar=bam&baz=bat&bop=', {
      k: 'v'
    });
    expect(url).to.equal('http://example.com/foo?bar=bam&baz=bat&bop=&k=v');
  });

  it('should not append null or undefined parameters to the url', function() {
    var url = ol.uri.appendParams('http://example.com/foo', {
      a: '1',
      b: null,
      c: undefined
    });
    expect(url).to.equal('http://example.com/foo?a=1');
  });

});
