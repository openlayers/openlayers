describe('ol.Object', function() {

  var o;
  beforeEach(function() {
    o = new ol.Object();
  });

  describe('get and set', function() {

    describe('get an unset property', function() {
      var v;
      beforeEach(function() {
        v = o.get('k');
      });

      it('returns undefined', function() {
        expect(v).toBeUndefined();
      });

    });

    describe('get a set property', function() {
      var v;
      beforeEach(function() {
        o.set('k', 1);
        v = o.get('k');
      });

      it('returns expected value', function() {
        expect(v).toEqual(1);
      });
    });
  });

  describe('setValues', function() {

    it('sets multiple values at once', function() {
      o.setValues({
        k1: 1,
        k2: 2
      });
      expect(o.get('k1')).toEqual(1);
      expect(o.get('k2')).toEqual(2);
    });
  });

  describe('notify', function() {

    var listener1, listener2;

    beforeEach(function() {
      listener1 = jasmine.createSpy();
      goog.events.listen(o, 'k_changed', listener1);

      var o2 = new ol.Object();
      o2.bindTo('k', o);
      listener2 = jasmine.createSpy();
      goog.events.listen(o2, 'k_changed', listener2);
    });

    it('dispatches events', function() {
      o.notify('k');
      expect(listener1).toHaveBeenCalled();
    });

    it('dispatches events to bound objects', function() {
      o.notify('k');
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('set', function() {

    var listener1, o2, listener2;

    beforeEach(function() {
      listener1 = jasmine.createSpy();
      goog.events.listen(o, 'k_changed', listener1);

      o2 = new ol.Object();
      o2.bindTo('k', o);
      listener2 = jasmine.createSpy();
      goog.events.listen(o2, 'k_changed', listener2);
    });

    it('dispatches events to object', function() {
      o.set('k', 1);
      expect(listener1).toHaveBeenCalled();
    });

    it('dispatches events to bound object', function() {
      o.set('k', 1);
      expect(listener2).toHaveBeenCalled();
    });

    it('dispatches events to object bound to', function() {
      o2.set('k', 2);
      expect(listener1).toHaveBeenCalled();
    });
  });

  describe('bind', function() {

    var o2;

    beforeEach(function() {
      o2 = new ol.Object();
    });

    describe('bindTo after set', function() {

      it('gets expected value', function() {
        o.set('k', 1);
        o2.bindTo('k', o);
        expect(o.get('k')).toEqual(1);
        expect(o2.get('k')).toEqual(1);
      });
    });

    describe('bindTo before set', function() {

      it('gets expected value', function() {
        o2.bindTo('k', o);
        o.set('k', 1);
        expect(o.get('k')).toEqual(1);
        expect(o2.get('k')).toEqual(1);
      });
    });

    describe('backwards', function() {
      describe('bindTo after set', function() {

        it('gets expected value', function() {
          o2.set('k', 1);
          o2.bindTo('k', o);
          expect(o.get('k')).toBeUndefined();
          expect(o2.get('k')).toBeUndefined();
        });
      });

      describe('bindTo before set', function() {

        it('gets expected value', function() {
          o2.bindTo('k', o);
          o2.set('k', 1);
          expect(o.get('k')).toEqual(1);
          expect(o2.get('k')).toEqual(1);
        });
      });
    });
  });

  describe('unbind', function() {
    var o2;

    beforeEach(function() {
      o2 = new ol.Object();
      o2.bindTo('k', o);
      o2.set('k', 1);
    });

    it('makes changes to unbound object invisible to other object', function() {
      // initial state
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(1);
      o2.unbind('k');
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(1);
      o2.set('k', 2);
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(2);
    });
  });

  describe('unbindAll', function() {
    var o2;

    beforeEach(function() {
      o2 = new ol.Object();
      o2.bindTo('k', o);
      o2.set('k', 1);
    });

    it('makes changes to unbound object invisible to other object', function() {
      // initial state
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(1);
      o2.unbindAll();
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(1);
      o2.set('k', 2);
      expect(o.get('k')).toEqual(1);
      expect(o2.get('k')).toEqual(2);
    });
  });

  describe('bind rename', function() {
    var listener1, o2, listener2;

    beforeEach(function() {
      o2 = new ol.Object();
      o2.bindTo('k2', o, 'k1');

      listener1 = jasmine.createSpy();
      goog.events.listen(o, 'k1_changed', listener1);

      listener2 = jasmine.createSpy();
      goog.events.listen(o2, 'k2_changed', listener2);
    });

    it('sets the expected properties', function() {
      o.set('k1', 1);
      expect(o.get('k1')).toEqual(1);
      expect(o.get('k2')).toBeUndefined();
      expect(o2.get('k2')).toEqual(1);
      expect(o2.get('k1')).toBeUndefined();
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('transitive bind', function() {
    var o2, o3;

    beforeEach(function() {
      o2 = new ol.Object();
      o3 = new ol.Object();
      o2.bindTo('k2', o, 'k1');
      o3.bindTo('k3', o2, 'k2');
    });

    it('sets the expected properties', function() {
      o.set('k1', 1);
      expect(o.get('k1')).toEqual(1);
      expect(o2.get('k2')).toEqual(1);
      expect(o3.get('k3')).toEqual(1);
    });

    describe('backward', function() {

      it('sets the expected properties', function() {
        o3.set('k3', 1);
        expect(o.get('k1')).toEqual(1);
        expect(o2.get('k2')).toEqual(1);
        expect(o3.get('k3')).toEqual(1);
      });
    });
  });

  describe('circular bind', function() {
    var o2;

    beforeEach(function() {
      o2 = new ol.Object();
      o.bindTo('k', o2);
    });

    it('throws an error', function() {
      expect(function() { o2.bindTo('k', o); }).toThrow();
    });
  });

  describe('priority', function() {
    var o2;

    beforeEach(function() {
      o2 = new ol.Object();
    });

    it('respects set order', function() {
      o.set('k', 1);
      o2.set('k', 2);
      o.bindTo('k', o2);
      expect(o.get('k')).toEqual(2);
      expect(o2.get('k')).toEqual(2);
    });

    it('respects set order (undefined)', function() {
      o.set('k', 1);
      o.bindTo('k', o2);
      expect(o.get('k')).toBeUndefined();
      expect(o2.get('k')).toBeUndefined();
    });
  });

  describe('setter', function() {
    beforeEach(function() {
      o.setX = function(x) {
        this.x = x;
      };
      spyOn(o, 'setX').andCallThrough();
    });

    describe('without bind', function() {
      it('does not call the setter', function() {
        o.set('x', 1);
        expect(o.get('x')).toEqual(1);
        expect(o.setX).not.toHaveBeenCalled();
      });
    });

    describe('with bind', function() {
      it('does call the setter', function() {
        var o2 = new ol.Object();
        o2.bindTo('x', o);
        o2.set('x', 1);
        expect(o.get('x')).toEqual(1);
        expect(o.setX).toHaveBeenCalled();
      });
    });
  });

  describe('getter', function() {
    beforeEach(function() {
      o.getX = function() {
        return 1;
      };
      spyOn(o, 'getX').andCallThrough();
    });

    describe('without bind', function() {
      it('does not call the getter', function() {
        expect(o.get('x')).toBeUndefined();
        expect(o.getX).not.toHaveBeenCalled();
      });
    });

    describe('with bind', function() {
      it('does call the getter', function() {
        var o2 = new ol.Object();
        o2.bindTo('x', o);
        expect(o2.get('x')).toEqual(1);
        expect(o.getX).toHaveBeenCalled();
      });
    });
  });

  describe('bind self', function() {
    it('throws an error', function() {
      expect(function() { o.bindTo('k', o); }).toThrow();
    });
  });

  describe('create with options', function() {
    it('sets the property', function() {
      var o = new ol.Object({k: 1});
      expect(o.get('k')).toEqual(1);
    });
  });

  describe('case sentivity', function() {
    var listener1, listener2;

    beforeEach(function() {
      listener1 = jasmine.createSpy();
      goog.events.listen(o, 'k_changed', listener1);
      listener2 = jasmine.createSpy();
      goog.events.listen(o, 'K_changed', listener2);
    });

    it('dispatches the expected event', function() {
      o.set('K', 1);
      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });
});

goog.require('ol.Object');
