import os
import zlib
import struct

# Polygon points for the Thunderbolt icon scaled to (width, height)
# Original points in 24x24 box: [(13,2), (3,14), (12,14), (11,22), (21,10), (12,10), (13,2)]

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def make_thunderbolt_png(width, height, is_banner=False):
    raw_data = bytearray()
    
    # Scale polygon coordinates to target canvas
    if is_banner:
        # Place Thunderbolt on left side of banner
        scale = min(width, height) * 0.5 / 24.0
        off_x = width * 0.15
        off_y = height * 0.25
    else:
        scale = min(width, height) * 0.75 / 24.0
        off_x = (width - 24 * scale) / 2.0
        off_y = (height - 24 * scale) / 2.0

    orig_poly = [(13, 2), (3, 14), (12, 14), (11, 22), (21, 10), (12, 10), (13, 2)]
    poly = [(px * scale + off_x, py * scale + off_y) for px, py in orig_poly]

    # Colors: Dark background (#050A14), Neon pink thunderbolt (#FF0055), Cyan accent (#00E5FF)
    r_bg, g_bg, b_bg = 5, 10, 20
    r_tb, g_tb, b_tb = 255, 0, 85   # #FF0055
    r_border, g_border, b_border = 0, 229, 255 # #00E5FF

    border_thick = max(1, min(width, height) // 30)

    for y in range(height):
        raw_data.append(0) # Filter type 0
        for x in range(width):
            is_bolt = point_in_polygon(x, y, poly)
            is_outer_border = (x < border_thick or x >= width - border_thick or y < border_thick or y >= height - border_thick)
            
            if is_bolt:
                raw_data.extend([r_tb, g_tb, b_tb])
            elif is_outer_border:
                raw_data.extend([r_border, g_border, b_border])
            else:
                raw_data.extend([r_bg, g_bg, b_bg])

    compressed = zlib.compress(raw_data)
    
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    
    return header + ihdr + idat + iend

out_dir = 'public/twitch-extension/assets'
os.makedirs(out_dir, exist_ok=True)

specs = [
    ('logo-100x100.png', 100, 100, False),
    ('icon-24x24.png', 24, 24, False),
    ('discovery-300x200.png', 300, 200, True),
    ('screenshot-1024x768.png', 1024, 768, True),
]

for filename, w, h, is_b in specs:
    path = os.path.join(out_dir, filename)
    with open(path, 'wb') as f:
        f.write(make_thunderbolt_png(w, h, is_b))
    print(f"Generated Thunderbolt PNG: {filename} ({w}x{h})")

print("All Thunderbolt Twitch extension PNGs generated successfully!")
