import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.style.RegularShape', function() {

  describe('#constructor', function() {

    it('can use rotateWithView', function() {
      const style = new RegularShape({
        rotateWithView: true,
        radius: 0
      });
      expect(style.getRotateWithView()).to.be(true);
    });

    it('can use radius', function() {
      const style = new RegularShape({
        radius: 5,
        radius2: 10
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(10);
    });

    it('can use radius1 as an alias for radius', function() {
      const style = new RegularShape({
        radius1: 5,
        radius2: 10
      });
      expect(style.getRadius()).to.eql(5);
      expect(style.getRadius2()).to.eql(10);
    });

    it('creates a canvas (no fill-style)', function() {
      const style = new RegularShape({radius: 10});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

    it('creates a canvas (fill-style)', function() {
      const style = new RegularShape({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([21, 21]);
      expect(style.getOrigin()).to.eql([0, 0]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([21, 21]);
    });

  });

  describe('#clone', function() {

    it('creates a new ol.style.RegularShape', function() {
      const original = new RegularShape({
        points: 5
      });
      const clone = original.clone();
      expect(clone).to.be.an(RegularShape);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      const original = new RegularShape({
        fill: new Fill({
          color: '#319FD3'
        }),
        points: 5,
        radius: 4,
        radius2: 6,
        angle: 1,
        stroke: new Stroke({
          color: '#319FD3'
        }),
        rotation: 2,
        rotateWithView: true
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      const clone = original.clone();
      expect(original.getAngle()).to.eql(clone.getAngle());
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getPoints()).to.eql(clone.getPoints());
      expect(original.getRadius()).to.eql(clone.getRadius());
      expect(original.getRadius2()).to.eql(clone.getRadius2());
      expect(original.getRotation()).to.eql(clone.getRotation());
      expect(original.getRotateWithView()).to.eql(clone.getRotateWithView());
      expect(original.getScale()).to.eql(clone.getScale());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
    });

    it('the clone does not reference the same objects as the original', function() {
      const original = new RegularShape({
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      const clone = original.clone();
      expect(original.getFill()).to.not.be(clone.getFill());
      expect(original.getStroke()).to.not.be(clone.getStroke());

      clone.getFill().setColor('#012345');
      clone.getStroke().setColor('#012345');
      expect(original.getFill().getColor()).to.not.eql(clone.getFill().getColor());
      expect(original.getStroke().getColor()).to.not.eql(clone.getStroke().getColor());
    });
  });

});
