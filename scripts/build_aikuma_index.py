#! /usr/bin/env python
#
# Usage: build_aikuma_index.py <directory> > <filename>
#
# Scan Aikuma directory structure and build a json index
# used by the transcriber tool.

# vim: tabstop=4:expandtab
 
import sys
import os
import glob
import json

def get_file_ext(filename):
    a = filename.split('.')
    if len(a) > 1:
        return ".".join(a[1:])

def get_base_dir(d):
    for r in os.walk(d):
        if 'recordings' in r[1] and 'users' in r[1] and 'images' in r[1]:
            return r[0]

originals = {}
commentaries = {}
speakers = {}

base = get_base_dir(sys.argv[1])

p = os.path.join(base, 'recordings', '*.json')
for f in glob.glob(p):
    obj = json.load(open(f))
    if 'original_uuid' not in obj or obj['original_uuid'] is None:
        originals[obj['uuid']] = obj
    else:
        commentaries[obj['uuid']] = obj

p = os.path.join(base, 'users', '*', 'metadata.json')
for f in glob.glob(p):
    obj = json.load(open(f))
    speakers[obj['uuid']] = obj

index = {
    'originals': originals,
    'commentaries': commentaries,
    'speakers': speakers
}

json.dump(index, sys.stdout)

