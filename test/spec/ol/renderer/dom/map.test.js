describe('ol.renderer.dom.Map', function() {

  var layer,
      map,
      prototype = ol.renderer.dom.Map.prototype;

  beforeEach(function() {
    // always use setTimeout based shim for requestAnimationFrame
    spyOn(goog.async.AnimationDelay.prototype, 'getRaf_')
        .andCallFake(function() {return null;});

    // set up renderer spies
    spyOn(prototype, 'render').andCallThrough();
    spyOn(prototype, 'beforeRenderFrame').andCallThrough();
    spyOn(prototype, 'renderFrame').andCallThrough();
    spyOn(prototype, 'afterRenderFrame').andCallThrough();

    layer = new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    });

    map = new ol.Map({
      center: new ol.Coordinate(0, 0),
      layers: new ol.Collection([layer]),
      renderer: ol.RendererHint.DOM,
      target: 'map',
      zoom: 1
    });

  });

  afterEach(function() {
    map.dispose();
    layer.dispose();
  });

  describe('#render', function() {
    it('is called immediately by ol.Map#render', function() {
      map.render();

      expect(prototype.render).toHaveBeenCalled();
      expect(prototype.render).toHaveBeenCalledWith(undefined);
    });

    it('is passed the callback passed to ol.Map#render', function() {
      function callback() {}
      map.render(callback);

      expect(prototype.render).toHaveBeenCalled();
      expect(prototype.render).toHaveBeenCalledWith(callback);
    });
  });

  describe('#renderFrame', function() {

    it('is not called immediately from ol.Map#render', function() {
      map.render();
      var renderer = map.renderer_,
          renderFrame = renderer.renderFrame,
          afterRenderFrame = renderer.afterRenderFrame;

      expect(prototype.renderFrame).not.toHaveBeenCalled();
      expect(prototype.afterRenderFrame).not.toHaveBeenCalled();

      waitsFor('afterRenderFrame to be called', 500, function() {
        return prototype.afterRenderFrame.callCount > 0;
      });

      runs(function() {
        expect(prototype.renderFrame).toHaveBeenCalled();
      });
    });

    it('is not called multiple times when setting map properties', function() {
      expect(prototype.renderFrame).not.toHaveBeenCalled();

      var callCount = 0;

      waitsFor('renderFrame to be called', 500, function() {
        callCount = prototype.renderFrame.callCount;
        return callCount > 0;
      });

      runs(function() {
        expect(prototype.renderFrame).toHaveBeenCalled();
        callCount = prototype.renderFrame.callCount;

        // renderFrame is not called immediately after ol.Map#setCenter
        map.setCenter(new ol.Coordinate(10, 10));
        expect(prototype.renderFrame.callCount).toEqual(callCount);

        // renderFrame is not called immediately after ol.Map#setResolution
        map.setResolution(map.getResolution() / 2);
        expect(prototype.renderFrame.callCount).toEqual(callCount);

        // renderFrame is called after some delay
        waitsFor('renderFrame to be called again', 500, function() {
          return prototype.renderFrame.callCount > callCount;
        });
      });

    });

  });


});
