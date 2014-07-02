import re
import os

BASE = 'js/closure-library/closure/goog'
GOOGDEPS = os.path.join(BASE, 'deps.js')

def norm(s):
    return [x.strip("\"'") for x in s.split(',')]

def parse(filename):
    for l in open(filename):
        l2 = re.sub(r'\s+', '', l)
        m = re.match(r'goog\.addDependency\((.*),\[(.*)\],\[(.*)\]', l2)
        if m:
            yield [norm(x) for x in m.groups()]

def build_dep(filename, module_file, module_deps):
    d = os.path.dirname(filename)
    for p, provides, requires in parse(filename):
        for x in provides:
            module_file[x] = os.path.join(BASE, p[0])
            module_deps[x] = requires

def print_dependencies(module, module_file, module_deps, out):
    if module not in module_file:
        return
    out[module_file[module]] = 1
    for dm in module_deps[module]:
        print_dependencies(dm, module_file, module_deps, out)

h = {}
g = {}
build_dep(GOOGDEPS, h, g)
build_dep('js/ldc/deps.js', h, g)

out = {}
print_dependencies('ldc', h, g, out)
print_dependencies('goog.net.XhrIo', h, g, out)
print_dependencies('cssom', h, g, out)

print 'java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS test/web/transcriber.js --js ' + os.path.join(BASE, 'base.js') + ' --js ' + ' --js '.join(out.keys())
