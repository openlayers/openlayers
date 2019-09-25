import {appendParams} from '../../../src/ol/uri.js';


describe('ol.uri.appendParams()', () => {

  test('should append empty STYLES with =', () => {
    const url = appendParams('http://example.com/foo', {
      SERVICE: 'WMS',
      STYLES: ''
    });
    expect(url).toBe('http://example.com/foo?SERVICE=WMS&STYLES=');
  });

  test('should URL encode values but not names', () => {
    const url = appendParams('http://example.com/foo', {
      'k ': 'v '
    });
    expect(url).toBe('http://example.com/foo?k =v%20');
  });

  test('should append to simple base URL', () => {
    const url = appendParams('http://example.com/foo', {
      k: 'v'
    });
    expect(url).toBe('http://example.com/foo?k=v');
  });

  test('should append to base URL with ?', () => {
    const url = appendParams('http://example.com/foo?', {
      k: 'v'
    });
    expect(url).toBe('http://example.com/foo?k=v');
  });

  test('should append to base URL with single existing param', () => {
    const url = appendParams('http://example.com/foo?bar=bam', {
      k: 'v'
    });
    expect(url).toBe('http://example.com/foo?bar=bam&k=v');
  });

  test(
    'should append to base URL with single existing param and extraneous &',
    () => {
      const url = appendParams('http://example.com/foo?bar=bam&', {
        k: 'v'
      });
      expect(url).toBe('http://example.com/foo?bar=bam&k=v');
    }
  );

  test('should append to base URL with two existing params', () => {
    const url = appendParams('http://example.com/foo?bar=bam&baz=bat', {
      k: 'v'
    });
    expect(url).toBe('http://example.com/foo?bar=bam&baz=bat&k=v');
  });

  test(
    'should append to base URL with three existing params last one empty',
    () => {
      const url = appendParams('http://example.com/foo?bar=bam&baz=bat&bop=', {
        k: 'v'
      });
      expect(url).toBe('http://example.com/foo?bar=bam&baz=bat&bop=&k=v');
    }
  );

  test('should not append null or undefined parameters to the url', () => {
    const url = appendParams('http://example.com/foo', {
      a: '1',
      b: null,
      c: undefined
    });
    expect(url).toBe('http://example.com/foo?a=1');
  });

});
