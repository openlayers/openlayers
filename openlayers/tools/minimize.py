# Minimal Python Minimizer
# Copyright 2008, Christopher Schmidt
# Released under the MIT License
#
# Taken from: http://svn.crschmidt.net/personal/python/minimize.py
# $Id: minimize.py 6 2008-01-03 06:33:35Z crschmidt $
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

import re

def strip_comments_helper(data):
    """remove all /* */ format comments and surrounding whitespace."""
    p = re.compile(r'[\s]*/\*.*?\*/[\s]*', re.DOTALL)
    return p.sub('',data)

def minimize(data, exclude=None):
    """Central function call. This will call all other compression
       functions. To add further compression algorithms, simply add
       functions whose names end in _helper which take a string as input 
       and return a more compressed string as output."""
    for key, item in globals().iteritems():
        if key.endswith("_helper"):
            func_key = key[:-7]
            if not exclude or not func_key in exclude:   
                data = item(data)
    return data   

if __name__ == "__main__":
    import sys
    print minimize(open(sys.argv[1]).read())
