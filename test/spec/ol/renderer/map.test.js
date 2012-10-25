describe('ol.renderer.Map', function() {

  var map;

  beforeEach(function() {
    map = new ol.Map({
      target: document.getElementById('map')
    });

    spyOn(map.renderer_, 'render').andCallThrough();
  });

  afterEach(function() {
    map.dispose();
  });

  describe('#render', function() {
    it('is called immediately by ol.Map#render', function() {
      map.render();

      var render = map.renderer_.render;
      expect(render.callCount).toEqual(1);
      expect(render).toHaveBeenCalledWith(undefined);
    });

    it('is passed the callback passed to ol.Map#render', function() {
      function callback() {}
      map.render(callback);

      var render = map.renderer_.render;
      expect(render.callCount).toEqual(1);
      expect(render).toHaveBeenCalledWith(callback);
    });
  });
});
