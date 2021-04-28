import {readDateTime} from '../../../../../src/ol/format/xsd.js';

describe('ol/format/xsd', function () {
  describe('readDateTime', function () {
    it('can handle non-Zulu time zones', function () {
      const node = document.createElement('time');
      node.textContent = '2016-07-12T15:00:00+03:00';
      expect(new Date(readDateTime(node) * 1000).toISOString()).to.eql(
        '2016-07-12T12:00:00.000Z'
      );
    });
  });
});
