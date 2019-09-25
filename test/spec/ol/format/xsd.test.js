import {readDateTime} from '../../../../src/ol/format/xsd.js';

describe('ol/format/xsd', () => {

  describe('readDateTime', () => {
    test('can handle non-Zulu time zones', () => {
      const node = document.createElement('time');
      node.textContent = '2016-07-12T15:00:00+03:00';
      expect(new Date(readDateTime(node) * 1000).toISOString()).toEqual('2016-07-12T12:00:00.000Z');
    });

  });

});
