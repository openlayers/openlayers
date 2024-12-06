import {get as getProjection} from '../../../../src/ol/proj.js';
import {
  getProjectionIdentifier,
  parseTokenClaims,
  serializeFunction,
} from '../../../../src/ol/source/SentinelHub.js';
import expect from '../../expect.js';

function trim(block) {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

describe('ol/source/SentinelHub.js', () => {
  describe('parseTokenClaims', () => {
    it('parses claims from an access token', () => {
      const token =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NlcnZpY2VzLnNlbnRpbmVsLWh1Yi5jb20vYXV0aC9yZWFsbXMvbWFpbiIsImlhdCI6MTcxNzQyOTYwMCwiZXhwIjoxNzQ4OTY1NjAwLCJhdWQiOiJ3d3cuZXhhbXBsZS5jb20iLCJzdWIiOiJqcm9ja2V0QGV4YW1wbGUuY29tIiwianRpIjoiMTJiYWRhNTUtMTIzNC00ZjVhLTY1MjgtZjEyOWFhMTkzOGJiIiwiY2xpZW50SWQiOiIyY2c1ZjBmMS1hYjA0LTNlMWMtM2E1Mi0zMDg0ODEwN2I5OWEiLCJjbGllbnRBZGRyZXNzIjoiMjI0LjEyMy4xMjMuMTU1IiwiY2xpZW50SG9zdCI6IjIyNC4xMjMuMTIzLjE1NSIsImFjY291bnQiOiIzZmVlMWIyOS1mMTViLWE0MjMtYzZjMS0yOWEwMmZmMmZhY2UifQ.tJOgcaeOwwvEQDVOThYXiJHIaIom4fi6psATnda7m0k';
      const claims = parseTokenClaims(token);

      expect(claims).to.eql({
        iss: 'https://services.sentinel-hub.com/auth/realms/main',
        iat: 1717429600,
        exp: 1748965600,
        aud: 'www.example.com',
        sub: 'jrocket@example.com',
        jti: '12bada55-1234-4f5a-6528-f129aa1938bb',
        clientId: '2cg5f0f1-ab04-3e1c-3a52-30848107b99a',
        clientAddress: '224.123.123.155',
        clientHost: '224.123.123.155',
        account: '3fee1b29-f15b-a423-c6c1-29a02ff2face',
      });
    });
  });

  describe('getProjectionIdentifier', () => {
    /**
     * @typedef {Object} Case
     * @property {string} input The projection identifier.
     * @property {string} output The expected Sentinel Hub CRS identifier.
     */

    /**
     * @type {Array<Case>}
     */
    const cases = [
      {
        input: 'EPSG:4326',
        output: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      },
      {
        input: 'CRS:84',
        output: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      },
      {
        input: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        output: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      },
      {
        input: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        output: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      },
      {
        input: 'urn:ogc:def:crs:OGC:2:84',
        output: 'http://www.opengis.net/def/crs/EPSG/0/4326',
      },
      {
        input: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
        output: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
      },
    ];

    for (const c of cases) {
      it(`works for ${c.input}`, () => {
        const projection = getProjection(c.input);
        const identifier = getProjectionIdentifier(projection);
        expect(identifier).to.equal(c.output);
      });
    }
  });

  describe('serializeFunction', () => {
    it('works for named functions', () => {
      function sum(a, b) {
        return a + b;
      }

      const got = serializeFunction('sum', sum);
      const exp = `
        var sum = function sum(a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works for functions named fun', () => {
      function fun(a, b) {
        return a + b;
      }

      const got = serializeFunction('fun', fun);
      const exp = `
        var fun = function fun(a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works for anonymous functions', () => {
      const sum = function (a, b) {
        return a + b;
      };

      const got = serializeFunction('sum', sum);
      const exp = `
        var sum = function (a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works for arrow functions', () => {
      const sum = (a, b) => a + b;

      const got = serializeFunction('sum', sum);
      const exp = `
        var sum = (a, b) => a + b;
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works for arrow functions without parens around args', () => {
      const double = a => 2 * a; // eslint-disable-line prettier/prettier

      const got = serializeFunction('double', double);
      const exp = `
        var double = a => 2 * a;
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works for anonymous functions assigned to object properties', () => {
      const o = {
        sum: function (a, b) {
          return a + b;
        },
      };

      const got = serializeFunction('sum', o.sum);
      const exp = `
        var sum = function (a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works with method syntax', () => {
      const o = {
        sum(a, b) {
          return a + b;
        },
      };

      const got = serializeFunction('sum', o.sum);
      const exp = `
        var sum = function sum(a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });

    it('works even if method name is "function"', () => {
      const o = {
        function(a, b) {
          return a + b;
        },
      };

      const got = serializeFunction('sum', o.function);
      const exp = `
        var sum = function(a, b) {
          return a + b;
        };
      `;
      expect(trim(got)).to.equal(trim(exp));
    });
  });
});
