import os
import shutil
import sys

from xml.etree.ElementTree import ElementTree
tree = ElementTree()
for dirPath, dirNames, fileNames in os.walk("/var/db/dhcpclient/leases/", topdown=False):
  print dirPath
  for f in fileNames:
    origonfile = os.path.join(dirPath, f)
    shutil.copy2(origonfile,'/tmp')
    tree.parse(origonfile)
    p = tree.find("dict/integer")
    print (p.text)
    print origonfile
