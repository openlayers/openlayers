import CircleStyle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';

describe('ol.style.Circle', function () {
  describe('#constructor', function () {
    it('creates a canvas (no fill-style)', function () {
      const style = new CircleStyle({radius: 10});
      expect(style.getImage(1)).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([20, 20]);
      expect(style.getImageSize()).to.eql([20, 20]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10, 10]);
      // no hit-detection image is created, because no fill style is set
      expect(style.getImage(1)).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
    });

    it('creates a canvas (transparent fill-style)', function () {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: 'transparent',
        }),
      });
      expect(style.getImage(1)).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([20, 20]);
      expect(style.getImageSize()).to.eql([20, 20]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10, 10]);
      // hit-detection image is created, because transparent fill style is set
      expect(style.getImage(1)).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
    });

    it('creates a canvas (non-transparent fill-style)', function () {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00',
        }),
      });
      expect(style.getImage(1)).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([20, 20]);
      expect(style.getImageSize()).to.eql([20, 20]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10, 10]);
      // no hit-detection image is created, because non-transparent fill style is set
      expect(style.getImage(1)).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
    });
  });

  describe('#clone', function () {
    it('creates a new ol.style.Circle', function () {
      const original = new CircleStyle();
      const clone = original.clone();
      expect(clone).to.be.an(CircleStyle);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function () {
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        radius: 5,
        scale: [1.5, 1],
        rotation: 2,
        rotateWithView: true,
        displacement: [10, 20],
      });
      original.setOpacity(0.5);
      const clone = original.clone();
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getRadius()).to.eql(clone.getRadius());
      expect(original.getRotation()).to.eql(clone.getRotation());
      expect(original.getRotateWithView()).to.eql(clone.getRotateWithView());
      expect(original.getScale()[0]).to.eql(clone.getScale()[0]);
      expect(original.getScale()[1]).to.eql(clone.getScale()[1]);
      expect(original.getStroke().getColor()).to.eql(
        clone.getStroke().getColor()
      );
      expect(original.getDisplacement()[0]).to.eql(clone.getDisplacement()[0]);
      expect(original.getDisplacement()[1]).to.eql(clone.getDisplacement()[1]);
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3',
        }),
        stroke: new Stroke({
          color: '#319FD3',
        }),
        scale: [1.5, 1],
        displacement: [0, 5],
      });
      const clone = original.clone();
      expect(original.getFill()).to.not.be(clone.getFill());
      expect(original.getStroke()).to.not.be(clone.getStroke());
      expect(original.getScale()).to.not.be(clone.getScale());
      expect(original.getDisplacement()).to.not.be(clone.getDisplacement());

      clone.getFill().setColor('#012345');
      clone.getStroke().setColor('#012345');
      expect(original.getFill().getColor()).to.not.eql(
        clone.getFill().getColor()
      );
      expect(original.getStroke().getColor()).to.not.eql(
        clone.getStroke().getColor()
      );
    });
  });

  describe('#setRadius', function () {
    it('changes the circle radius', function () {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00',
        }),
      });
      expect(style.getRadius()).to.eql(10);
      style.setRadius(20);
      expect(style.getRadius()).to.eql(20);
    });
  });
});
