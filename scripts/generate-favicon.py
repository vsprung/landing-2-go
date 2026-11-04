# Usage: python3 scripts/generate-favicon.py public
# Rasterises the ALU3 favicon (rectangles on a 32-unit grid) to PNG/ICO without deps.
import struct, zlib, sys
out = sys.argv[1]
G = (0x1c,0x20,0x24); P = (0xee,0xf0,0xf1); A = (0x8f,0xa3,0xe0)
# (x, y, w, h, colour) in 32-unit grid; later rects paint over earlier ones.
RECTS = [(0,0,32,32,G),
         (6,6,20,3,A),                       # top rail, accent
         (7,9,4,17,P),(14,9,4,17,P),(21,9,4,17,P),  # three pickets
         (6,22,20,2,P)]                      # bottom rail
def colour(x,y):
    c=None
    for rx,ry,rw,rh,col in RECTS:
        if rx<=x<rx+rw and ry<=y<ry+rh: c=col
    return c
def render(n, ss=4):
    rows=[]
    for py in range(n):
        row=b'\x00'
        for px in range(n):
            acc=[0,0,0]
            for sy in range(ss):
                for sx in range(ss):
                    c=colour((px+(sx+.5)/ss)*32/n,(py+(sy+.5)/ss)*32/n)
                    for i in range(3): acc[i]+=c[i]
            row+=bytes(round(v/ss/ss) for v in acc)+b'\xff'
        rows.append(row)
    raw=b''.join(rows)
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',n,n,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
open(f'{out}/apple-touch-icon.png','wb').write(render(180))
sizes=[16,32,48]; pngs=[render(s) for s in sizes]
hdr=struct.pack('<HHH',0,1,len(sizes)); off=6+16*len(sizes); ents=b''
for s,p in zip(sizes,pngs):
    ents+=struct.pack('<BBBBHHII',s,s,0,0,1,32,len(p),off); off+=len(p)
open(f'{out}/favicon.ico','wb').write(hdr+ents+b''.join(pngs))
