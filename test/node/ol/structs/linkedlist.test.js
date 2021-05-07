import LinkedList from '../../../../src/ol/structs/LinkedList.js';
import expect from '../../expect.js';

describe('ol/structs/LinkedList.js', function () {
  let ll;
  const item = {};
  const item2 = {};
  beforeEach(function () {
    ll = new LinkedList();
  });

  it('defaults to circular', function () {
    expect(ll.circular_).to.be(true);
  });

  it('creates an empty list', function () {
    expect(ll.length_).to.be(0);
    expect(ll.first_).to.be(undefined);
    expect(ll.last_).to.be(undefined);
    expect(ll.head_).to.be(undefined);
  });

  describe('#insertItem', function () {
    beforeEach(function () {
      ll.insertItem(item);
    });

    it('inserts an item into the list', function () {
      expect(ll.length_).to.be(1);
    });

    it('sets the cursor to the inserted item', function () {
      expect(ll.head_.data).to.be(item);
    });

    it('links the previous item to the new one', function () {
      ll.insertItem(item2);
      expect(ll.head_.prev.data).to.be(item);
      expect(ll.head_.prev.next.data).to.be(item2);
    });
  });

  describe('#removeItem', function () {
    const item3 = {};
    beforeEach(function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
    });

    it('removes the current item', function () {
      ll.removeItem();
      expect(ll.length_).to.be(2);
      expect(ll.head_.data).not.to.be(item3);
    });

    it('sets the cursor to the next item if possible', function () {
      ll.removeItem();
      expect(ll.head_.data).to.be(item);
    });

    it('otherwise sets the cursor to the previous item', function () {
      ll = new LinkedList(false);
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
      ll.removeItem();
      expect(ll.head_.data).to.be(item2);
    });

    it('empties a list with only one item', function () {
      ll = new LinkedList();
      ll.insertItem(item);
      ll.removeItem();
      expect(ll.length_).to.be(0);
      expect(ll.head_).to.be(undefined);
      expect(ll.first_).to.be(undefined);
      expect(ll.last_).to.be(undefined);
    });
  });

  describe('#firstItem', function () {
    it('sets the cursor to the first item and returns its data', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      const i = ll.firstItem();
      expect(i).to.be(item);
      expect(ll.head_.data).to.be(item);
    });

    it('returns undefined on empty list', function () {
      const i = ll.firstItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#lastItem', function () {
    it('sets the cursor to the last item and returns its data', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.firstItem();
      const i = ll.lastItem();
      expect(i).to.be(item2);
      expect(ll.head_.data).to.be(item2);
    });

    it('returns undefined on empty list', function () {
      const i = ll.lastItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#nextItem', function () {
    it('sets the cursor to the next item and returns its data', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.firstItem();
      const i = ll.nextItem();
      expect(i).to.be(item2);
      expect(ll.head_.data).to.be(item2);
    });

    it('returns undefined on empty list', function () {
      const i = ll.nextItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#prevItem', function () {
    it('sets the cursor to the previous item and returns its data', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      const i = ll.prevItem();
      expect(i).to.be(item);
      expect(ll.head_.data).to.be(item);
    });

    it('returns undefined on empty list', function () {
      const i = ll.prevItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#getNextItem', function () {
    it('returns the data of the next item without stepping the cursor', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.firstItem();
      const i = ll.getNextItem();
      expect(i).to.be(item2);
      expect(ll.head_.data).to.be(item);
    });

    it('returns undefined on empty list', function () {
      const i = ll.getNextItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#getPrevItem', function () {
    it('returns the data of the previous item without stepping the cursor', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      const i = ll.getPrevItem();
      expect(i).to.be(item);
      expect(ll.head_.data).to.be(item2);
    });

    it('returns undefined on empty list', function () {
      const i = ll.getPrevItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#getCurrItem', function () {
    it('returns the data of the current item', function () {
      const item3 = {};
      ll.insertItem(item);
      ll.insertItem(item2);
      ll.insertItem(item3);
      ll.prevItem();
      const i = ll.getCurrItem();
      expect(i).to.be(item2);
      expect(ll.head_.data).to.be(item2);
    });

    it('returns undefined on empty list', function () {
      const i = ll.getCurrItem();
      expect(i).to.be(undefined);
    });
  });

  describe('#getLength', function () {
    it('returns the length of the list', function () {
      ll.insertItem(item);
      ll.insertItem(item2);
      const l = ll.getLength();
      expect(l).to.be(2);
    });
  });

  describe('#concat', function () {
    let ll2, item3;
    beforeEach(function () {
      item3 = {};
      ll2 = new LinkedList();
      ll2.insertItem(item);
      ll2.insertItem(item2);
      ll2.insertItem(item3);
    });

    it('concatenates a second list with the current one', function () {
      const item4 = {};
      const item5 = {};
      const item6 = {};
      ll.insertItem(item4);
      ll.insertItem(item5);
      ll.insertItem(item6);
      ll.prevItem();
      ll.concat(ll2);
      expect(ll.length_).to.be(6);
      expect(ll.head_.data).to.be(item5);
      expect(ll.head_.next.data).to.be(item);
      expect(ll.head_.next.next.next.next.data).to.be(item6);
    });

    it('receives the second list if the current one is empty', function () {
      ll.concat(ll2);
      expect(ll.length_).to.be(3);
      expect(ll.first_.data).to.be(item);
      expect(ll.last_.data).to.be(item3);
      expect(ll.head_.data).to.be(item3);
    });

    it('destroys the second list', function () {
      ll.concat(ll2);
      expect(ll2.length_).to.be(0);
      expect(ll2.first_).to.be(undefined);
      expect(ll2.last_).to.be(undefined);
      expect(ll2.head_).to.be(undefined);
    });
  });

  describe('when circular', function () {
    beforeEach(function () {
      ll = new LinkedList();
      ll.insertItem(item);
    });

    describe('#insertItem', function () {
      it('initializes the list in a circular way', function () {
        expect(ll.head_.prev.data).to.be(item);
        expect(ll.head_.next.data).to.be(item);
      });
    });

    describe('#setFirstItem', function () {
      it('resets the first item to the current one', function () {
        ll.insertItem(item2);
        ll.setFirstItem();
        expect(ll.first_.data).to.be(item2);
        expect(ll.last_.data).to.be(item);
      });
    });
  });
});
