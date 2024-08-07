import Feature from '../../../../src/ol/Feature.js';
import GML2 from '../../../../src/ol/format/GML2.js';
import GML3 from '../../../../src/ol/format/GML3.js';
import WFS from '../../../../src/ol/format/WFS.js';
import expect from '../../expect.js';

describe('ol/format/WFS.js', () => {
  describe('#writeTransaction()', () => {
    const writeTransaction = (gmlFormat) => {
      const wfs = new WFS({version: '2.0.0', gmlFormat});
      const feature = new Feature({foo: null, bar: undefined});
      wfs.writeTransaction([feature], [], [], {
        featurePrefix: 'sf',
        featureNS: 'http://www.openplans.org/spearfish',
        featureType: 'bugsites',
        nativeElements: [],
      });
    };

    it('does not throw on null or undefined property values when using GML2', () => {
      expect(() => writeTransaction(new GML2())).to.not.throwException();
    });

    it('does not throw on null or undefined property values when using GML3', () => {
      expect(() => writeTransaction(new GML3())).to.not.throwException();
    });
  });
});
