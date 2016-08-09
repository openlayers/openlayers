goog.provide('ol.test.structs.PriorityQueue');

goog.require('ol.structs.PriorityQueue');


describe('ol.structs.PriorityQueue', function() {

  var identity = function(a) {
    return a;
  };

  describe('when empty', function() {

    var pq, origAssert;
    beforeEach(function() {
      origAssert = console.assert;
      console.assert = function(assertion, message) {
        if (!assertion) {
          throw new Error(message);
        }
      };
      pq = new ol.structs.PriorityQueue(
          identity, identity);
    });
    afterEach(function() {
      console.assert = origAssert;
    });

    it('is valid', function() {
      expect(function() {
        pq.assertValid();
      }).not.to.throwException();
    });

    it('is empty', function() {
      expect(pq.isEmpty()).to.be(true);
    });

    it('dequeue raises an exception', function() {
      expect(function() {
        pq.dequeue();
      }).to.throwException();
    });

    it('enqueue adds an element', function() {
      var added = pq.enqueue(0);
      expect(function() {
        pq.assertValid();
      }).not.to.throwException();
      expect(added).to.be(true);
      expect(pq.elements_).to.eql([0]);
      expect(pq.priorities_).to.eql([0]);
    });

    it('do not enqueue element with DROP priority', function() {
      var added = pq.enqueue(Infinity);
      expect(function() {
        pq.assertValid();
      }).not.to.throwException();
      expect(added).to.be(false);
      expect(pq.elements_).to.eql([]);
      expect(pq.priorities_).to.eql([]);
    });

    it('maintains the pq property while elements are enqueued', function() {
      var i;
      for (i = 0; i < 32; ++i) {
        pq.enqueue(Math.random());
        expect(function() {
          pq.assertValid();
        }).not.to.throwException();
      }
    });

  });

  describe('when populated', function() {

    var elements, pq;
    beforeEach(function() {
      elements = [];
      pq = new ol.structs.PriorityQueue(
          identity, identity);
      var element, i;
      for (i = 0; i < 32; ++i) {
        element = Math.random();
        pq.enqueue(element);
        elements.push(element);
      }
    });

    it('dequeues elements in the correct order', function() {
      elements.sort();
      var i;
      for (i = 0; i < elements.length; ++i) {
        expect(pq.dequeue()).to.be(elements[i]);
      }
      expect(pq.isEmpty()).to.be(true);
    });

  });

  describe('with an impure priority function', function() {

    var pq, target;
    beforeEach(function() {
      target = 0.5;
      pq = new ol.structs.PriorityQueue(function(element) {
        return Math.abs(element - target);
      }, identity);
      var i;
      for (i = 0; i < 32; ++i) {
        pq.enqueue(Math.random());
      }
    });

    it('dequeue elements in the correct order', function() {
      var lastDelta = 0;
      var delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).to.be(true);
        lastDelta = delta;
      }
    });

    it('allows reprioritization', function() {
      var target = 0.5;
      pq.reprioritize();
      var lastDelta = 0;
      var delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).to.be(true);
        lastDelta = delta;
      }
    });

    it('allows dropping during reprioritization', function() {
      var target = 0.5;
      var i = 0;
      pq.priorityFunction_ = function(element) {
        if (i++ % 2 === 0) {
          return Math.abs(element - target);
        } else {
          return ol.structs.PriorityQueue.DROP;
        }
      };
      pq.reprioritize();
      expect(pq.getCount()).to.be(16);
      var lastDelta = 0;
      var delta;
      while (!pq.isEmpty()) {
        delta = Math.abs(pq.dequeue() - target);
        expect(lastDelta <= delta).to.be(true);
        lastDelta = delta;
      }
    });

  });

  describe('tracks elements in the queue', function() {

    var pq;
    beforeEach(function() {
      pq = new ol.structs.PriorityQueue(
          identity, identity);
      pq.enqueue('a');
      pq.enqueue('b');
      pq.enqueue('c');
    });

    it('tracks which elements have been queued', function() {
      expect(pq.isQueued('a')).to.be(true);
      expect(pq.isQueued('b')).to.be(true);
      expect(pq.isQueued('c')).to.be(true);
    });

    it('tracks which elements have not been queued', function() {
      expect(pq.isQueued('d')).to.be(false);
    });

    it('raises an error when an queued element is re-queued', function() {
      expect(function() {
        pq.enqueue('a');
      }).to.throwException();
    });

    it('tracks which elements have be dequeued', function() {
      expect(pq.isQueued('a')).to.be(true);
      expect(pq.isQueued('b')).to.be(true);
      expect(pq.isQueued('c')).to.be(true);
      expect(pq.dequeue()).to.be('a');
      expect(pq.isQueued('a')).to.be(false);
      expect(pq.isQueued('b')).to.be(true);
      expect(pq.isQueued('c')).to.be(true);
      expect(pq.dequeue()).to.be('b');
      expect(pq.isQueued('a')).to.be(false);
      expect(pq.isQueued('b')).to.be(false);
      expect(pq.isQueued('c')).to.be(true);
      expect(pq.dequeue()).to.be('c');
      expect(pq.isQueued('a')).to.be(false);
      expect(pq.isQueued('b')).to.be(false);
      expect(pq.isQueued('c')).to.be(false);
    });

  });

});
