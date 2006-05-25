#
# According to <http://www.vrplumber.com/programming/> this file
# is licensed under a BSD-style license. We only use the section
# originally by Tim Peters.
#
# TODO: The use of this code needs to be okayed by someone.
#

class RecursionError( OverflowError, ValueError ):
    '''Unable to calculate result because of recursive structure'''
    

def sort(nodes, routes, noRecursion=1):
    '''Passed a list of node IDs and a list of source,dest ID routes
    attempt to create a list of stages where each sub list
    is one stage in a process.
    '''
    children, parents = _buildChildrenLists(routes)
    # first stage is those nodes
    # having no incoming routes...
    stage = []
    stages = [stage]
    taken = []
    for node in nodes:
        if (not parents.get(node)):
            stage.append (node)
    if nodes and not stage:
        # there is no element which does not depend on
        # some other element!!!
        stage.append( nodes[0])
    taken.extend( stage )
    nodes = filter ( lambda x, l=stage: x not in l, nodes )
    while nodes:
        previousStageChildren = []
        nodelen = len(nodes)
        # second stage are those nodes
        # which are direct children of the first stage
        for node in stage:
            for child in children.get (node, []):
                if child not in previousStageChildren and child not in taken:
                    previousStageChildren.append(child)
                elif child in taken and noRecursion:
                    raise RecursionError( (child, node) )
        # unless they are children of other direct children...
        # TODO, actually do that...
        stage = previousStageChildren
        removes = []
        for current in stage:
            currentParents = parents.get( current, [] )
            for parent in currentParents:
                if parent in stage and parent != current:
                    # might wind up removing current...
                    if not current in parents.get(parent, []):
                        # is not mutually dependent...
                        removes.append( current )
        for remove in removes:
            while remove in stage:
                stage.remove( remove )
        stages.append( stage)
        taken.extend( stage )
        nodes = filter ( lambda x, l=stage: x not in l, nodes )
        if nodelen == len(nodes):
            if noRecursion:
                raise RecursionError( nodes )
            else:
                stages.append( nodes[:] )
                nodes = []
    return stages

def _buildChildrenLists (routes):
    childrenTable = {}
    parentTable = {}
    for sourceID,destinationID in routes:
        currentChildren = childrenTable.get( sourceID, [])
        currentParents = parentTable.get( destinationID, [])
        if not destinationID in currentChildren:
            currentChildren.append ( destinationID)
        if not sourceID in currentParents:
            currentParents.append ( sourceID)
        childrenTable[sourceID] = currentChildren
        parentTable[destinationID] = currentParents
    return childrenTable, parentTable


def toposort (nodes, routes, noRecursion=1):
    '''Topological sort from Tim Peters, fairly efficient
    in comparison (it seems).'''
    #first calculate the recursion depth
    
    dependencies = {}
    inversedependencies = {}
    if not nodes:
        return []
    if not routes:
        return [nodes]
    for node in nodes:
        dependencies[ node ] = (0, node)
        inversedependencies[ node ] = []
    
    
    for depended, depends in routes:
        # is it a null rule
        try:
            newdependencylevel, object = dependencies.get ( depends, (0, depends))
        except TypeError:
            print depends
            raise
        dependencies[ depends ] = (newdependencylevel + 1,  depends)
        # "dependency (existence) of depended-on"
        newdependencylevel,object = dependencies.get ( depended, (0, depended) )
        dependencies[ depended ] = (newdependencylevel, depended)
        # Inverse dependency set up
        dependencieslist = inversedependencies.get ( depended, [])
        dependencieslist.append (depends)
        inversedependencies[depended] = dependencieslist
    ### Now we do the actual sorting
    # The first task is to create the sortable
    # list of dependency-levels
    sortinglist = dependencies.values()
    sortinglist.sort ()
    output = []
    while sortinglist:
        deletelist = []
        generation = []
        output.append( generation)
        while sortinglist and sortinglist[0][0] == 0:
            number, object = sortinglist[0]
            generation.append ( object )
            deletelist.append( object )
            for inverse in inversedependencies.get(object, () ):
                try:
                    oldcount, inverse = dependencies [ inverse]
                    if oldcount > 0:
                        # will be dealt with on later pass
                        dependencies [ inverse] = (oldcount-1, inverse)
                    else:
                        # will be dealt with on this pass,
                        # so needs not to be in the sorting list next time
                        deletelist.append( inverse )
                    # just in case a loop comes through
                    inversedependencies[object] = []
                except KeyError:
                    # dealing with a recursion-breaking run...
                    pass
            del sortinglist [0]
        # if no elements could be deleted, then
        # there is something which depends upon itself
        if not deletelist:
            if noRecursion:
                raise RecursionError( sortinglist )
            else:
                # hack so that something gets deleted...
##                import pdb
##                pdb.set_trace()
                dependencies[sortinglist[0][1]] = (0,sortinglist[0][1])
        # delete the items that were dealt with
        for item in deletelist:
            try:
                del dependencies [ item ]
            except KeyError:
                pass
        # need to recreate the sortinglist
        sortinglist = dependencies.values()
        if not generation:
            output.remove( generation )
        sortinglist.sort ()
    return output





if __name__ == "__main__":

    nodes = ['a', 'b', 'c', 'd', 'e', 'f']
    route = [('a', 'b'), ('b', 'c'), ('b', 'd'), ('e','f')]

    for x in  toposort( nodes, route):
        for a in x:
            print a

    raise SystemExit



    import pprint, traceback
    nodes= [ 0,1,2,3,4,5 ]
    testingValues = [
        [ (0,1),(1,2),(2,3),(3,4),(4,5)],
        [ (0,1),(0,2),(1,2),(3,4),(4,5)],
        [
        (0,1),
        (0,2),
        (0,2),
                    (2,4),
                    (2,5),
                (3,2),
        (0,3)],
        [
        (0,1), # 3-element cycle test, no orphan nodes
        (1,2),
        (2,0),
                    (2,4),
                    (2,5),
                (3,2),
        (0,3)],
        [
        (0,1),
        (1,1),
        (1,1),
                (1,4),
                (1,5),
                (1,2),
        (3,1),
        (2,1),
        (2,0)],
        [
            (0,1),
            (1,0),
            (0,2),
            (0,3),
        ],
        [
            (0,1),
            (1,0),
            (0,2),
            (3,1),
        ],
    ]
    print 'sort, no recursion allowed'
    for index in range(len(testingValues)):
##        print '    %s -- %s'%( index, testingValues[index])
        try:
            print '        ', sort( nodes, testingValues[index] )
        except:
            print 'exception raised'
    print 'toposort, no recursion allowed'
    for index in range(len(testingValues)):
##        print '    %s -- %s'%( index, testingValues[index])
        try:
            print '        ', toposort( nodes, testingValues[index] )
        except:
            print 'exception raised'
    print 'sort, recursion allowed'
    for index in range(len(testingValues)):
##        print '    %s -- %s'%( index, testingValues[index])
        try:
            print '        ', sort( nodes, testingValues[index],0 )
        except:
            print 'exception raised'
    print 'toposort, recursion allowed'
    for index in range(len(testingValues)):
##        print '    %s -- %s'%( index, testingValues[index])
        try:
            print '        ', toposort( nodes, testingValues[index],0 )
        except:
            print 'exception raised'
        
        
    
