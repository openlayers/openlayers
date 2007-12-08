#!/usr/bin/env python

import sys
import os
import re
import urllib2

missing_deps = False
try:
    import simplejson
    from BeautifulSoup import BeautifulSoup
except ImportError, E:
    missing_deps = E 


def getListOfOnlineExamples(baseUrl):
    """
    useful if you want to get a list of examples a url. not used by default.
    """
    html = urllib2.urlopen(baseUrl)
    soup = BeautifulSoup(html)
    examples = soup.findAll('li')
    examples = [example.find('a').get('href') for example in examples]
    examples = [example for example in examples if example.endswith('.html')]
    examples = [example for example in examples]
    return examples
    
def getListOfExamples(relPath):
    """
    returns list of .html filenames within a given path
    """
    examples = os.listdir(relPath)
    examples = [example for example in examples if example.endswith('.html')]
    return examples
    

def getExampleHtml(location):
    """
    returns html of a specific example that is available online or locally
    """
    print '.',
    if location.startswith('http'):
        return urllib2.urlopen(location).read()
    else:
        f = open(location)
        html = f.read()
        f.close()
        return html
        
    
def extractById(soup, tagId, value=None):
    """
    returns full contents of a particular tag id
    """
    beautifulTag = soup.find(id=tagId)
    if beautifulTag:
        if beautifulTag.contents: 
            value = str(beautifulTag.renderContents()).strip()
            value = value.replace('\t','')
            value = value.replace('\n','')
    return value

def getRelatedClasses(html):
    """
    parses the html, and returns a list of all OpenLayers Classes 
    used within (ie what parts of OL the javascript uses).  
    """
    rawstr = r'''(?P<class>OpenLayers\..*?)\('''
    return re.findall(rawstr, html)

def parseHtml(html,ids):
    """
    returns dictionary of items of interest
    """
    soup = BeautifulSoup(html)
    d = {}
    for tagId in ids:
        d[tagId] = extractById(soup,tagId)
    #classes should eventually be parsed from docs - not automatically created.
    classes = getRelatedClasses(html)
    d['classes'] = classes
    return d
    

if __name__ == "__main__":

    if missing_deps:
        print "This script requires simplejson and BeautifulSoup. You don't have them. \n(%s)" % E
        sys.exit()
    
    if len(sys.argv) > 1:
        outFile = open(sys.argv[1],'w')
    else:
        outFile = open('../doc/examples.js','w')
    
    examplesLocation = '../examples'
    print 'Reading examples from %s and writing out to %s' % (examplesLocation, outFile.name)
   
    exampleList = []
    docIds = ['title','shortdesc']
   
    #comment out option to create docs from online resource
    #examplesLocation = 'http://svn.openlayers.org/sandbox/docs/examples/'
    #examples = getListOfOnlineExamples(examplesLocation)

    examples = getListOfExamples(examplesLocation)

    for example in examples:
        url = os.path.join(examplesLocation,example)
        html = getExampleHtml(url)
        tagvalues = parseHtml(html,docIds)
        tagvalues['example'] = example
        tagvalues['link'] = url
        exampleList.append(tagvalues)
        
    exampleList.sort(key=lambda x:x['example'].lower())
    json = simplejson.dumps(exampleList)
    #give the json a global variable we can use in our js.  This should be replaced or made optional.
    json = 'var examples=' + json 
    outFile.write(json)
    outFile.close()
    print 'complete'

    
