from os import walk


f = []
for (dirpath, dirnames, filenames) in walk("./"):
    f.extend(filenames)

print(f)
