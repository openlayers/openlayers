import {zoneFromCode} from '../../../../src/ol/proj/utm.js';
import expect from '../../expect.js';

describe('ol/proj/utm.js', () => {
  describe('zoneFromCode', () => {
    const cases = [
      {
        code: 'EPSG:32721',
        zone: {number: 21, north: false},
      },
      {
        code: 'EPSG:32612',
        zone: {number: 12, north: true},
      },
      {
        code: 'urn:ogc:def:crs:EPSG::32740',
        zone: {number: 40, north: false},
      },
      {
        code: 'http://www.opengis.net/def/crs/EPSG/0/32742',
        zone: {number: 42, north: false},
      },
      {
        code: 'urn:ogc:def:crs:EPSG::4326',
        zone: null,
      },
      {
        code: 'http://www.opengis.net/def/crs/EPSG/0/4326',
        zone: null,
      },
      {
        code: 'EPSG:4326',
        zone: null,
      },
      {
        code: 'EPSG:foo',
        zone: null,
      },
    ];

    for (const c of cases) {
      it(`works for ${c.code}`, () => {
        const zone = zoneFromCode(c.code);
        expect(zone).to.eql(c.zone);
      });
    }
  });
});
