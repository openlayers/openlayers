describe("ol.geom.multipoint", function() {
    var mp;
    beforeEach(function() {
        mp = ol.geom.multipoint([
            {x:0, y:1},
            {x:2, y:3}
        ]);
    });

    afterEach(function() {
        mp = null;
    });
    describe("can construct instances without some points", function() {
        it("works for the object notation of points", function(){
            expect( mp ).toBeA( ol.geom.MultiPoint );
        });

        it("works for the array notation of points", function(){
            mp = ol.geom.multipoint([
                [0, 1],
                [2, 3]
            ]);

            expect( mp ).toBeA( ol.geom.MultiPoint );
        });

        it("works for real points", function(){
            mp = ol.geom.multipoint([
                ol.geom.point([0,1]),
                ol.geom.point([2,3])
            ]);

            expect( mp ).toBeA( ol.geom.MultiPoint );
        });
    });

    describe("can construct instances without any points", function() {

        it("works with an empty array", function(){
            mp = ol.geom.multipoint([]);

            expect( mp ).toBeA( ol.geom.MultiPoint );
        });

        it("works without arguments", function(){
            mp = ol.geom.multipoint();

            expect( mp ).toBeA( ol.geom.MultiPoint );
        });
    });

    describe("the method 'add'", function() {
        it("exists", function(){
            expect( mp.add ).toBeA( Function );
        });

        describe("can be used as setter", function(){
            it("works with a single point specification and an index", function(){
                var p = ol.geom.point([24,7]);
                mp.add(p, 0);

                expect(mp.points().length).toBe(3);

                var firstPoint = mp.points()[0];

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with point instance", function(){
                mp = ol.geom.multipoint();
                mp.add(ol.geom.point([24,7]));
                expect(mp.points().length).toBe(1);
                var firstPoint = mp.points()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with array specifications", function(){
                mp = ol.geom.multipoint();
                mp.add([24,7]);
                expect(mp.points().length).toBe(1);
                var firstPoint = mp.points()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with object specifications", function(){
                mp = ol.geom.multipoint();
                mp.add({x:24,y:7});
                expect(mp.points().length).toBe(1);
                var firstPoint = mp.points()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("the index is functional", function(){
                var p = ol.geom.point([24,7]);
                mp.add(p, 1);

                expect(mp.points().length).toBe(3);

                var firstPoint = mp.points()[0],  // untouched
                    secondPoint = mp.points()[1], // this should be ours
                    thirdPoint = mp.points()[2];  // shifted here

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '0,1' );
                expect( secondPoint.x() + ',' + secondPoint.y() ).toBe( '24,7' );
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '2,3' );
            });

            it("the index is optional", function(){
                var p = ol.geom.point([24,7]);
                mp.add(p);

                expect(mp.points().length).toBe(3);

                var thirdPoint = mp.points()[2];
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '24,7' );
            });

            it("returns the multipoint instance", function(){
                var p = ol.geom.point([24,7]);
                var returned = mp.add(p);

                expect(returned).toBe(mp);
            });
        });
    });

    describe("the method 'addAll'", function(){
        it("exists", function(){
            expect( mp.addAll ).toBeA( Function );
        });

        describe("can be used as setter", function(){

            it("works with an array of point specifications and an index", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point([7,11])
                ];
                mp.addAll(ps, 0);

                expect(mp.points().length).toBe(4);

                var firstPoint = mp.points()[0],
                    secondPoint = mp.points()[1];

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
                expect( secondPoint.x() + ',' + secondPoint.y() ).toBe( '7,11' );
            });

            it("the index is functional", function(){
                var ps = [
                    [24,7],
                    {x:7, y:11}
                ];
                mp.addAll(ps, 1);

                expect(mp.points().length).toBe(4);

                var firstPoint = mp.points()[0],  // untouched
                    secondPoint = mp.points()[1], // this should be ours
                    thirdPoint = mp.points()[2],  // this should be ours
                    fourthPoint = mp.points()[3];  // shifted here

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '0,1' );
                expect( secondPoint.x() + ',' + secondPoint.y() ).toBe( '24,7' );
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '7,11' );
                expect( fourthPoint.x() + ',' + fourthPoint.y() ).toBe( '2,3' );
            });

            it("the index is optional", function(){
                var ps = [
                    [24,7],
                    {x:7, y:11}
                ];
                mp.addAll(ps);

                expect(mp.points().length).toBe(4);

                var thirdPoint = mp.points()[2],
                    fourthPoint = mp.points()[3];
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '24,7' );
                expect( fourthPoint.x() + ',' + fourthPoint.y() ).toBe( '7,11' );
            });

            it("returns the multipoint instance", function(){
                var ps = [
                    [24,7],
                    {x:7, y:11}
                ];
                var returned = mp.addAll(ps);

                expect(returned).toBe(mp);
            });
        });
    });


    describe("the method 'remove'", function() {
        it("exists", function(){
            expect( mp.remove ).toBeA( Function );
        });

        it("works with a single point", function(){
            var p = mp.points()[0];
            mp.remove(p);
            expect(mp.points().length).toBe(1);
            var firstPoint = mp.points()[0];
            expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '2,3' );
        });

        it("works with an array of point specifications", function(){
            var ps = [
                mp.points()[1],
                mp.points()[0]
            ];
            mp.remove(ps);
            expect(mp.points().length).toBe(0);
        });
    });

    describe("the centroid method is functional", function(){
        it("returns an instance of ol.geom.Point", function(){
            expect(mp.centroid()).toBeA(ol.geom.Point);
        });

        it("has the expected coordinates", function(){
            mp.points([
                new ol.geom.Point(10,10),
                new ol.geom.Point(20,20),
                new ol.geom.Point(30,30)
            ]);
            var c = mp.centroid();
            expect(c.x() + ',' + c.y()).toBe('20,20');
        });
    });
});




