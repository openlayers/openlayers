#!/usr/bin/env python

import sys
import os
import re
import time
from xml.dom.minidom import Document

try:
    import xml.etree.ElementTree as ElementTree
except ImportError:
    try:
        import cElementTree as ElementTree  # NOQA
    except ImportError:
        try:
            import elementtree.ElementTree as ElementTree # NOQA
        except ImportError:
            import lxml.etree as ElementTree  # NOQA

missing_deps = False
try:
    import json
except ImportError:
    try:
        import simplejson as json  # NOQA
    except ImportError, E:
        missing_deps = E

try:
    from BeautifulSoup import BeautifulSoup
except ImportError, E:
    missing_deps = E

feedName = "example-list.xml"
feedPath = "http://openlayers.github.io/ol3/master/examples/"


def getListOfExamples(relPath):
    """
    returns list of .html filenames within a given path - excludes
    index.html
    """
    examples = os.listdir(relPath)
    examples = [example for example in examples if
                example.endswith('.html') and example != "index.html"]
    return examples


def getExampleHtml(path):
    """
    returns html of a specific example
    """
    print '.',
    f = open(path)
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
            value = value.replace('\t', '')
            value = value.replace('\n', '')
    return value


def getRelatedClasses(html):
    """
    parses the html, and returns a list of all OpenLayers Classes
    used within (ie what parts of OL the javascript uses).
    """
    rawstr = r'''(?P<class>ol\..*?)\('''
    return re.findall(rawstr, html)


def parseHtml(html, ids):
    """
    returns dictionary of items of interest
    """
    soup = BeautifulSoup(html)
    d = {}
    for tagId in ids:
        d[tagId] = extractById(soup, tagId)
    #classes should eventually be parsed from docs - not automatically created.
    classes = getRelatedClasses(html)
    d['classes'] = classes
    return d


def getGitInfo(exampleDir, exampleName):
    orig = os.getcwd()
    os.chdir(exampleDir)
    h = os.popen("git log -n 1 --pretty=format:'%an|%ai' " + exampleName)
    os.chdir(orig)
    log = h.read()
    h.close()
    d = {}
    if log:
        parts = log.split("|")
        d["author"] = parts[0]
        # compensate for spaces in git log time
        td = parts[1].split(" ")
        td.insert(1, "T")
        d["date"] = "".join(td)
    else:
        d["author"] = ""
        d["date"] = ""
    return d


def createFeed(examples):
    doc = Document()
    atomuri = "http://www.w3.org/2005/Atom"
    feed = doc.createElementNS(atomuri, "feed")
    feed.setAttribute("xmlns", atomuri)
    title = doc.createElementNS(atomuri, "title")
    title.appendChild(doc.createTextNode("OpenLayers Examples"))
    feed.appendChild(title)
    link = doc.createElementNS(atomuri, "link")
    link.setAttribute("rel", "self")
    link.setAttribute("href", feedPath + feedName)

    modtime = time.strftime("%Y-%m-%dT%I:%M:%SZ", time.gmtime())
    id = doc.createElementNS(atomuri, "id")
    id.appendChild(doc.createTextNode(
        "%s%s#%s" % (feedPath, feedName, modtime)))
    feed.appendChild(id)

    updated = doc.createElementNS(atomuri, "updated")
    updated.appendChild(doc.createTextNode(modtime))
    feed.appendChild(updated)

    examples.sort(key=lambda x: x["modified"])
    for example in sorted(examples, key=lambda x: x["modified"], reverse=True):
        entry = doc.createElementNS(atomuri, "entry")

        title = doc.createElementNS(atomuri, "title")
        title.appendChild(doc.createTextNode(example["title"] or
                                             example["example"]))
        entry.appendChild(title)

        tags = doc.createElementNS(atomuri, "tags")
        tags.appendChild(doc.createTextNode(example["tags"] or
                                            example["example"]))
        entry.appendChild(tags)

        link = doc.createElementNS(atomuri, "link")
        link.setAttribute("href", "%s%s" % (feedPath, example["example"]))
        entry.appendChild(link)

        summary = doc.createElementNS(atomuri, "summary")
        summary.appendChild(doc.createTextNode(example["shortdesc"] or
                                               example["example"]))
        entry.appendChild(summary)

        updated = doc.createElementNS(atomuri, "updated")
        updated.appendChild(doc.createTextNode(example["modified"]))
        entry.appendChild(updated)

        author = doc.createElementNS(atomuri, "author")
        name = doc.createElementNS(atomuri, "name")
        name.appendChild(doc.createTextNode(example["author"]))
        author.appendChild(name)
        entry.appendChild(author)

        id = doc.createElementNS(atomuri, "id")
        id.appendChild(doc.createTextNode("%s%s#%s" % (feedPath,
                                                       example["example"],
                                                       example["modified"])))
        entry.appendChild(id)

        feed.appendChild(entry)

    doc.appendChild(feed)
    return doc


def wordIndex(examples):
    """
    Create an inverted index based on words in title and shortdesc.  Keys are
    lower cased words.  Values are dictionaries with example index keys and
    count values.
    """
    index = {}
    unword = re.compile("\\W+")
    keys = ["shortdesc", "title", "tags"]
    for i in range(len(examples)):
        for key in keys:
            text = examples[i][key]
            if text:
                words = unword.split(text)
                for word in words:
                    if word:
                        word = word.lower()
                        if word in index:
                            if i in index[word]:
                                index[word][i] += 1
                            else:
                                index[word][i] = 1
                        else:
                            index[word] = {i: 1}
    return index

if __name__ == "__main__":

    if missing_deps:
        print """This script requires json or simplejson and BeautifulSoup.
You don't have them. \n(%s)""" % E
        sys.exit()

    if len(sys.argv) == 3:
        inExampleDir = sys.argv[1]
        outExampleDir = sys.argv[2]
    else:
        inExampleDir = "../examples"
        outExampleDir = "../examples"

    outFile = open(os.path.join(outExampleDir, "example-list.js"), "w")

    print 'Reading examples from %s and writing out to %s' % (inExampleDir,
                                                              outFile.name)

    exampleList = []
    docIds = ['title', 'shortdesc', 'tags']

    examples = getListOfExamples(inExampleDir)

    modtime = time.strftime("%Y-%m-%dT%I:%M:%SZ", time.gmtime())

    for example in examples:
        path = os.path.join(inExampleDir, example)
        html = getExampleHtml(path)
        tagvalues = parseHtml(html, docIds)
        tagvalues['example'] = example
        # add in author/date info
        d = getGitInfo(inExampleDir, example)
        tagvalues["author"] = d["author"] or "anonymous"
        tagvalues["modified"] = d["date"] or modtime
        tagvalues['link'] = example

        exampleList.append(tagvalues)

    print

    exampleList.sort(key=lambda x: x['example'].lower())

    index = wordIndex(exampleList)

    json = json.dumps({"examples": exampleList, "index": index})
    # Give the json a global variable we can use in our js.
    # This should be replaced or made optional.
    json = 'var info=' + json + ';'
    outFile.write(json)
    outFile.close()

    outFeedPath = os.path.join(outExampleDir, feedName)
    print "writing feed to %s " % outFeedPath
    atom = open(outFeedPath, 'w')
    doc = createFeed(exampleList)
    atom.write(doc.toxml())
    atom.close()

    print 'complete'
