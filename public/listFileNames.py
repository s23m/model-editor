from os import walk
from pydub import AudioSegment

f = []
for (dirpath, dirnames, filenames) in walk("./"):
    f.extend(filenames)

print(f)
