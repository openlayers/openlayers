import {lineStringIsClosed} from '../../../../../src/ol/geom/flat/topology.js';

describe('ol.geom.flat.topology', () => {

  describe('ol.geom.flat.topology.lineStringIsClosed', () => {

    test('identifies closed lines aka boundaries', () => {
      const flatCoordinates = [0, 0, 3, 0, 0, 3, 0, 0];
      const isClosed = lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).toBe(true);
    });

    test('identifies regular linestrings', () => {
      const flatCoordinates = [0, 0, 3, 0, 0, 3, 5, 2];
      const isClosed = lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).toBe(false);
    });

    test('identifies degenerate boundaries', () => {
      let flatCoordinates = [0, 0, 3, 0, 0, 0];
      let isClosed = lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).toBe(false);

      flatCoordinates = [0, 0, 1, 1, 3, 3, 5, 5, 0, 0];
      isClosed = lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClosed).toBe(false);
    });

  });

});
