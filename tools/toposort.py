"""
toposort.py
Sorts dictionary keys based on lists of dependencies.
"""

class MissingDependency(Exception):
    """Exception raised when a listed dependency is not in the dictionary."""

class Sorter(object):
    def __init__(self, dependencies):
        self.dependencies = dependencies
        self.visited = set()
        self.sorted = ()
    
    def sort(self):
        for key in self.dependencies:
            self._visit(key)
        return self.sorted
    
    def _visit(self, key):
        if key not in self.visited:
            self.visited.add(key)
            if not self.dependencies.has_key(key):
                raise MissingDependency(key)
            for depends in self.dependencies[key]:
                self._visit(depends)
            self.sorted += (key,)

def toposort(dependencies):
    """Returns a tuple of the dependencies dictionary keys sorted by entries
    in the dependency lists.  Given circular dependencies, sort will impose
    an order.  Raises MissingDependency if a key is not found.
    """
    s = Sorter(dependencies)
    return s.sort()
