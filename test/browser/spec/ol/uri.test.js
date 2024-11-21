import {appendParams, expandUrl} from '../../../../src/ol/uri.js';

describe('ol/uri.js', () => {
  describe('expandUrl', function () {
    describe('with number range', function () {
      it('creates expected URLs', function () {
        const template = 'http://tile-{1-3}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).to.eql([
          'http://tile-1/{z}/{x}/{y}',
          'http://tile-2/{z}/{x}/{y}',
          'http://tile-3/{z}/{x}/{y}',
        ]);
      });
      it('creates expected URLs', function () {
        const template = 'http://tile-{9-11}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).to.eql([
          'http://tile-9/{z}/{x}/{y}',
          'http://tile-10/{z}/{x}/{y}',
          'http://tile-11/{z}/{x}/{y}',
        ]);
      });
    });
    describe('with character range', function () {
      it('creates expected URLs', function () {
        const template = 'http://tile-{c-e}/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).to.eql([
          'http://tile-c/{z}/{x}/{y}',
          'http://tile-d/{z}/{x}/{y}',
          'http://tile-e/{z}/{x}/{y}',
        ]);
      });
    });
    describe('without range', function () {
      it('creates expected URLs', function () {
        const template = 'http://tiles.example.com/{z}/{x}/{y}';
        const urls = expandUrl(template);
        expect(urls).to.eql(['http://tiles.example.com/{z}/{x}/{y}']);
      });
    });
  });

  describe('appendParams()', function () {
    it('should append empty STYLES with =', function () {
      const url = appendParams('http://example.com/foo', {
        SERVICE: 'WMS',
        STYLES: '',
      });
      expect(url).to.equal('http://example.com/foo?SERVICE=WMS&STYLES=');
    });

    it('should URL encode values but not names', function () {
      const url = appendParams('http://example.com/foo', {
        'k ': 'v ',
      });
      expect(url).to.equal('http://example.com/foo?k =v%20');
    });

    it('should append to simple base URL', function () {
      const url = appendParams('http://example.com/foo', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?k=v');
    });

    it('should append to base URL with ?', function () {
      const url = appendParams('http://example.com/foo?', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?k=v');
    });

    it('should append to base URL with single existing param', function () {
      const url = appendParams('http://example.com/foo?bar=bam', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?bar=bam&k=v');
    });

    it('should append to base URL with single existing param and extraneous &', function () {
      const url = appendParams('http://example.com/foo?bar=bam&', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?bar=bam&k=v');
    });

    it('should append to base URL with two existing params', function () {
      const url = appendParams('http://example.com/foo?bar=bam&baz=bat', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?bar=bam&baz=bat&k=v');
    });

    it('should append to base URL with three existing params last one empty', function () {
      const url = appendParams('http://example.com/foo?bar=bam&baz=bat&bop=', {
        k: 'v',
      });
      expect(url).to.equal('http://example.com/foo?bar=bam&baz=bat&bop=&k=v');
    });

    it('should not append null or undefined parameters to the url', function () {
      const url = appendParams('http://example.com/foo', {
        a: '1',
        b: null,
        c: undefined,
      });
      expect(url).to.equal('http://example.com/foo?a=1');
    });
  });
});
