import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Vector from '../../../../src/ol/layer/Vector.js';

describe('ol/layer/Vector.js', () => {
  describe('change event', () => {
    it('is fired if the style is modified', (done) => {
      const style = new Style({fill: new Fill({color: 'yellow'})});
      const layer = new Vector({style});
      layer.on('change', () => done());

      style.getFill().setColor('black');
    });
  });
});
