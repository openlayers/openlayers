import AtlasManager from '../../../../src/ol/style/AtlasManager.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.style.Circle', function() {

  describe('#constructor', function() {

    it('creates a canvas if no atlas is used (no fill-style)', function() {
      const style = new CircleStyle({radius: 10});
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

    it('creates a canvas if no atlas is used (fill-style)', function() {
      const style = new CircleStyle({
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

    it('adds itself to an atlas manager (no fill-style)', function() {
      const atlasManager = new AtlasManager({initialSize: 512});
      const style = new CircleStyle({radius: 10, atlasManager: atlasManager});
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // hit-detection image is created, because no fill style is set
      expect(style.getImage()).to.not.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });

    it('adds itself to an atlas manager (fill-style)', function() {
      const atlasManager = new AtlasManager({initialSize: 512});
      const style = new CircleStyle({
        radius: 10,
        atlasManager: atlasManager,
        fill: new Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getImage()).to.be.an(HTMLCanvasElement);
      expect(style.getSize()).to.eql([21, 21]);
      expect(style.getImageSize()).to.eql([512, 512]);
      expect(style.getOrigin()).to.eql([1, 1]);
      expect(style.getAnchor()).to.eql([10.5, 10.5]);
      // no hit-detection image is created, because fill style is set
      expect(style.getImage()).to.be(style.getHitDetectionImage());
      expect(style.getHitDetectionImage()).to.be.an(HTMLCanvasElement);
      expect(style.getHitDetectionImageSize()).to.eql([512, 512]);
    });
  });

  describe('#clone', function() {

    it('creates a new ol.style.Circle', function() {
      const original = new CircleStyle();
      const clone = original.clone();
      expect(clone).to.be.an(CircleStyle);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      const original = new CircleStyle({
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        }),
        radius: 5
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      const clone = original.clone();
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getRadius()).to.eql(clone.getRadius());
      expect(original.getScale()).to.eql(clone.getScale());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
    });

    it('the clone does not reference the same objects as the original', function() {
      const original = new CircleStyle({
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

  describe('#getChecksum', function() {

    it('calculates the same hash code for default options', function() {
      const style1 = new CircleStyle();
      const style2 = new CircleStyle();
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (radius)', function() {
      const style1 = new CircleStyle();
      const style2 = new CircleStyle({
        radius: 5
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (radius)', function() {
      const style1 = new CircleStyle({
        radius: 5
      });
      const style2 = new CircleStyle({
        radius: 5
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (color)', function() {
      const style1 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        })
      });
      const style2 = new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (everything set)', function() {
      const style1 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      const style2 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (stroke width differs)', function() {
      const style1 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 3
        })
      });
      const style2 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (fill)', function() {
      const style1 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      const style2 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getFill().setColor('red');
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (stroke)', function() {
      const style1 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      const style2 = new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: '#319FD3'
        }),
        stroke: new Stroke({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getStroke().setWidth(4);
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

  });

  describe('#setRadius', function() {
    it('changes the circle radius', function() {
      const style = new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: '#FFFF00'
        })
      });
      expect(style.getRadius()).to.eql(10);
      style.setRadius(20);
      expect(style.getRadius()).to.eql(20);
    });
  });

});
