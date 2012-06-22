describe("ol.geom.collection", function() {
    var c;
    beforeEach(function() {
        c = ol.geom.collection([
            ol.geom.point([0, 1]),
            ol.geom.linestring([
                ol.geom.point([2, 3]),
                ol.geom.point([4, 5])
            ])
        ]);
    });

    afterEach(function() {
        c = null;
    });
    describe("can construct instances with some components", function() {
        it("works for instances of ol.geom.Geometry", function(){
            expect( c ).toBeA( ol.geom.Collection );
        });
    });

    describe("can construct instances without any components", function() {

        it("works with an empty array", function(){
            c = ol.geom.collection([]);

            expect( c ).toBeA( ol.geom.Collection );
        });

        it("works without arguments", function(){
            c = ol.geom.collection();

            expect( c ).toBeA( ol.geom.Collection );
        });
    });

    describe("the method 'add'", function() {
        it("exists", function(){
            expect( c.add ).toBeA( Function );
        });

        describe("can be used as setter", function(){
            it("works with a single point specification and an index", function(){
                var p = ol.geom.point([24,7]);
                c.add(p, 0);

                expect(c.components().length).toBe(3);

                var firstComponent = c.components()[0];

                expect( firstComponent.x() + ',' + firstComponent.y() ).toBe( '24,7' );
            });

            it("the index is functional", function(){
                var p = ol.geom.point([24,7]);
                c.add(p, 1);

                expect(c.components().length).toBe(3);

                var firstComponent = c.components()[0],  // untouched
                    secondComponent = c.components()[1], // this should be ours
                    thirdComponent = c.components()[2];  // shifted here

                expect( firstComponent.x() + ',' + firstComponent.y() ).toBe( '0,1' );
                expect( secondComponent.x() + ',' + secondComponent.y() ).toBe( '24,7' );
                expect( thirdComponent ).toBeA( ol.geom.LineString );
            });

            it("the index is optional", function(){
                var p = ol.geom.point([24,7]);
                c.add(p);

                expect(c.components().length).toBe(3);

                var thirdComponent = c.components()[2];
                expect( thirdComponent.x() + ',' + thirdComponent.y() ).toBe( '24,7' );
            });

            it("returns the collection instance", function(){
                var p = ol.geom.point([24,7]);
                var returned = c.add(p);

                expect(returned).toBe(c);
            });
        });
    });

    describe("the method 'addAll'", function(){
        it("exists", function(){
            expect( c.addAll ).toBeA( Function );
        });

        describe("can be used as setter", function(){

            it("works with an array of points and an index", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point([7,11])
                ];
                c.addAll(ps, 0);

                expect(c.components().length).toBe(4);

                var firstComponent = c.components()[0],
                    secondComponent = c.components()[1];

                expect( firstComponent.x() + ',' + firstComponent.y() ).toBe( '24,7' );
                expect( secondComponent.x() + ',' + secondComponent.y() ).toBe( '7,11' );
            });

            it("the index is functional", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point({x:7, y:11})
                ];
                c.addAll(ps, 1);

                expect(c.components().length).toBe(4);

                var firstComponent = c.components()[0],  // untouched
                    secondComponent = c.components()[1], // this should be ours
                    thirdComponent = c.components()[2],  // this should be ours
                    fourthComponent = c.components()[3];  // shifted here

                expect( firstComponent.x() + ',' + firstComponent.y() ).toBe( '0,1' );
                expect( secondComponent.x() + ',' + secondComponent.y() ).toBe( '24,7' );
                expect( thirdComponent.x() + ',' + thirdComponent.y() ).toBe( '7,11' );
                expect( fourthComponent ).toBeA( ol.geom.LineString );
            });

            it("the index is optional", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point({x:7, y:11})
                ];
                c.addAll(ps);

                expect(c.components().length).toBe(4);

                var thirdComponent = c.components()[2],
                    fourthComponent = c.components()[3];
                expect( thirdComponent.x() + ',' + thirdComponent.y() ).toBe( '24,7' );
                expect( fourthComponent.x() + ',' + fourthComponent.y() ).toBe( '7,11' );
            });

            it("returns the collection instance", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point({x:7, y:11})
                ];
                var returned = c.addAll(ps);

                expect(returned).toBe(c);
            });
        });
    });


    describe("the method 'remove'", function() {
        it("exists", function(){
            expect( c.add ).toBeA( Function );
        });

        it("works with a single point", function(){
            var p = c.components()[0];
            c.remove(p);
            expect(c.components().length).toBe(1);
            var firstComponent = c.components()[0];
            expect( firstComponent ).toBeA( ol.geom.LineString );
        });

        it("works with an array of point specifications", function(){
            var ps = [
                c.components()[1],
                c.components()[0]
            ];
            c.remove(ps);
            expect(c.components().length).toBe(0);
        });
    });
});




