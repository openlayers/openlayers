

import _ol_style_AtlasManager_ from '../../../../src/ol/style/atlasmanager';
import _ol_style_Circle_ from '../../../../src/ol/style/circle';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';


describe('ol.style.Circle', function() {

  describe('#constructor', function() {

    it('creates a canvas if no atlas is used (no fill-style)', function() {
      var style = new _ol_style_Circle_({radius: 10});
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
      var style = new _ol_style_Circle_({
        radius: 10,
        fill: new _ol_style_Fill_({
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
      var atlasManager = new _ol_style_AtlasManager_({initialSize: 512});
      var style = new _ol_style_Circle_({radius: 10, atlasManager: atlasManager});
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
      var atlasManager = new _ol_style_AtlasManager_({initialSize: 512});
      var style = new _ol_style_Circle_({
        radius: 10,
        atlasManager: atlasManager,
        fill: new _ol_style_Fill_({
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
      var original = new _ol_style_Circle_();
      var clone = original.clone();
      expect(clone).to.be.an(_ol_style_Circle_);
      expect(clone).to.not.be(original);
    });

    it('copies all values', function() {
      var original = new _ol_style_Circle_({
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        }),
        radius: 5,
        snapToPixel: false
      });
      original.setOpacity(0.5);
      original.setScale(1.5);
      var clone = original.clone();
      expect(original.getFill().getColor()).to.eql(clone.getFill().getColor());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getRadius()).to.eql(clone.getRadius());
      expect(original.getScale()).to.eql(clone.getScale());
      expect(original.getSnapToPixel()).to.eql(clone.getSnapToPixel());
      expect(original.getStroke().getColor()).to.eql(clone.getStroke().getColor());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new _ol_style_Circle_({
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      var clone = original.clone();
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
      var style1 = new _ol_style_Circle_();
      var style2 = new _ol_style_Circle_();
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (radius)', function() {
      var style1 = new _ol_style_Circle_();
      var style2 = new _ol_style_Circle_({
        radius: 5
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (radius)', function() {
      var style1 = new _ol_style_Circle_({
        radius: 5
      });
      var style2 = new _ol_style_Circle_({
        radius: 5
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());
    });

    it('calculates not the same hash code (color)', function() {
      var style1 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        })
      });
      var style2 = new _ol_style_Circle_({
        radius: 5,
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('calculates the same hash code (everything set)', function() {
      var style1 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 2
        })
      });
      var style2 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
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
      var style1 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3',
          lineCap: 'round',
          lineDash: [5, 15, 25],
          lineJoin: 'miter',
          miterLimit: 4,
          width: 3
        })
      });
      var style2 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
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
      var style1 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      var style2 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      expect(style1.getChecksum()).to.eql(style2.getChecksum());

      style1.getFill().setColor('red');
      expect(style1.getChecksum()).to.not.eql(style2.getChecksum());
    });

    it('invalidates a cached checksum if values change (stroke)', function() {
      var style1 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
          color: '#319FD3'
        })
      });
      var style2 = new _ol_style_Circle_({
        radius: 5,
        fill: new _ol_style_Fill_({
          color: '#319FD3'
        }),
        stroke: new _ol_style_Stroke_({
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
      var style = new _ol_style_Circle_({
        radius: 10,
        fill: new _ol_style_Fill_({
          color: '#FFFF00'
        })
      });
      expect(style.getRadius()).to.eql(10);
      style.setRadius(20);
      expect(style.getRadius()).to.eql(20);
    });
  });

});
