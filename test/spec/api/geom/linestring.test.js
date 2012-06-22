describe("ol.geom.linestring", function() {
    var ls;
    beforeEach(function() {
        ls = ol.geom.linestring([
            {x:0, y:1},
            {x:2, y:3}
        ]);
    });

    afterEach(function() {
        ls = null;
    });
    describe("can construct instances with some vertices", function() {
        it("works for the object notation of vertices", function(){
            expect( ls ).toBeA( ol.geom.LineString );
        });

        it("works for the array notation of vertices", function(){
            ls = ol.geom.linestring([
                [0, 1],
                [2, 3]
            ]);

            expect( ls ).toBeA( ol.geom.LineString );
        });

        it("works for real vertices", function(){
            ls = ol.geom.linestring([
                ol.geom.point([0,1]),
                ol.geom.point([2,3])
            ]);

            expect( ls ).toBeA( ol.geom.LineString );
        });
    });

    describe("can construct instances without any vertices", function() {

        it("works with an empty array", function(){
            ls = ol.geom.linestring([]);

            expect( ls ).toBeA( ol.geom.LineString );
        });

        it("works without arguments", function(){
            ls = ol.geom.linestring();

            expect( ls ).toBeA( ol.geom.LineString );
        });
    });

    describe("the method 'add'", function() {
        it("exists", function(){
            expect( ls.add ).toBeA( Function );
        });

        describe("can be used as setter", function(){
            it("works with a single vertex specification and an index", function(){
                var p = ol.geom.point([24,7]);
                ls.add(p, 0);

                expect(ls.vertices().length).toBe(3);

                var firstPoint = ls.vertices()[0];

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with point instance", function(){
                ls = ol.geom.linestring();
                ls.add(ol.geom.point([24,7]));
                expect(ls.vertices().length).toBe(1);
                var firstPoint = ls.vertices()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with array specifications", function(){
                ls = ol.geom.linestring();
                ls.add([24,7]);
                expect(ls.vertices().length).toBe(1);
                var firstPoint = ls.vertices()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("works with object specifications", function(){
                ls = ol.geom.linestring();
                ls.add({x:24,y:7});
                expect(ls.vertices().length).toBe(1);
                var firstPoint = ls.vertices()[0];
                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
            });

            it("the index is functional", function(){
                var p = ol.geom.point([24,7]);
                ls.add(p, 1);

                expect(ls.vertices().length).toBe(3);

                var firstPoint = ls.vertices()[0],  // untouched
                    secondPoint = ls.vertices()[1], // this should be ours
                    thirdPoint = ls.vertices()[2];  // shifted here

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '0,1' );
                expect( secondPoint.x() + ',' + secondPoint.y() ).toBe( '24,7' );
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '2,3' );
            });

            it("the index is optional", function(){
                var p = ol.geom.point([24,7]);
                ls.add(p);

                expect(ls.vertices().length).toBe(3);

                var thirdPoint = ls.vertices()[2];
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '24,7' );
            });

            it("returns the linestring instance", function(){
                var p = ol.geom.point([24,7]);
                var returned = ls.add(p);

                expect(returned).toBe(ls);
            });
        });
    });

    describe("the method 'addAll'", function(){
        it("exists", function(){
            expect( ls.addAll ).toBeA( Function );
        });

        describe("can be used as setter", function(){

            it("works with an array of point specifications and an index", function(){
                var ps = [
                    ol.geom.point([24,7]),
                    ol.geom.point([7,11])
                ];
                ls.addAll(ps, 0);

                expect(ls.vertices().length).toBe(4);

                var firstPoint = ls.vertices()[0],
                    secondPoint = ls.vertices()[1];

                expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '24,7' );
                expect( secondPoint.x() + ',' + secondPoint.y() ).toBe( '7,11' );
            });

            it("the index is functional", function(){
                var ps = [
                    [24,7],
                    {x:7, y:11}
                ];
                ls.addAll(ps, 1);

                expect(ls.vertices().length).toBe(4);

                var firstPoint = ls.vertices()[0],  // untouched
                    secondPoint = ls.vertices()[1], // this should be ours
                    thirdPoint = ls.vertices()[2],  // this should be ours
                    fourthPoint = ls.vertices()[3];  // shifted here

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
                ls.addAll(ps);

                expect(ls.vertices().length).toBe(4);

                var thirdPoint = ls.vertices()[2],
                    fourthPoint = ls.vertices()[3];
                expect( thirdPoint.x() + ',' + thirdPoint.y() ).toBe( '24,7' );
                expect( fourthPoint.x() + ',' + fourthPoint.y() ).toBe( '7,11' );
            });

            it("returns the linestring instance", function(){
                var ps = [
                    [24,7],
                    {x:7, y:11}
                ];
                var returned = ls.addAll(ps);

                expect(returned).toBe(ls);
            });
        });
    });

    describe("the method 'remove'", function() {
        it("exists", function(){
            expect( ls.remove ).toBeA( Function );
        });

        it("works with a single point", function(){
            var p = ls.vertices()[0];
            ls.remove(p);
            expect(ls.vertices().length).toBe(1);
            var firstPoint = ls.vertices()[0];
            expect( firstPoint.x() + ',' + firstPoint.y() ).toBe( '2,3' );
        });

        it("works with an array of point specifications", function(){
            var ps = [
                ls.vertices()[1],
                ls.vertices()[0]
            ];
            ls.remove(ps);
            expect(ls.vertices().length).toBe(0);
        });
    });
});




