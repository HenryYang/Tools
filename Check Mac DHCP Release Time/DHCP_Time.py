import os
import shutil
import sys
from xml.etree.ElementTree import ElementTree


for dirPath, dirNames, fileNames in os.walk("/var/db/dhcpclient/leases/"):
  for FileName in fileNames:
    originPath = os.path.join(dirPath, FileName)
    shutil.copy2(originPath,'/tmp')
    getXML = ElementTree()
    getXML.parse(originPath)
    DHCPtime = getXML.find("dict/integer")
    print (FileName +' DHCP release time is : '+ DHCPtime.text)
