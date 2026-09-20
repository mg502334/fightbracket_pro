import os
import zlib
import struct

def create_exact_png(width, height, draw_type="logo"):
    raw_data = bytearray()
    
    for y in range(height):
        raw_data.append(0) # Filter 0
        for x in range(width):
            # Cyberpunk / Neon color scheme
            # Dark navy background: #050a14 (5, 10, 20)
            r, g, b = 5, 10, 20
            
            # Border: #00e5ff (0, 229, 255)
            border_t = max(2, min(width, height) // 25)
            is_border = (x < border_t or x >= width - border_t or y < border_t or y >= height - border_t)

            if is_border:
                r, g, b = 0, 229, 255
            elif draw_type == "logo":
                # Center badge: #ff006e
                if width * 0.2 <= x <= width * 0.8 and height * 0.2 <= y <= height * 0.8:
                    r, g, b = 255, 0, 110
                    # Inner text accent: #ffffff
                    if width * 0.35 <= x <= width * 0.65 and height * 0.4 <= y <= height * 0.6:
                        r, g, b = 255, 255, 255
            elif draw_type == "icon":
                if width * 0.25 <= x <= width * 0.75 and height * 0.25 <= y <= height * 0.75:
                    r, g, b = 255, 0, 110
            elif draw_type == "discovery":
                # Banner graphics
                if height * 0.3 <= y <= height * 0.7 and width * 0.1 <= x <= width * 0.9:
                    r, g, b = 11, 19, 43
                if height * 0.4 <= y <= height * 0.6 and width * 0.15 <= x <= width * 0.85:
                    r, g, b = 0, 229, 255
            elif draw_type == "screenshot":
                # Stream preview UI graphic
                if height * 0.15 <= y <= height * 0.85 and width * 0.1 <= x <= width * 0.9:
                    r, g, b = 15, 23, 42
                if height * 0.2 <= y <= height * 0.35 and width * 0.15 <= x <= width * 0.85:
                    r, g, b = 0, 229, 255
                if height * 0.4 <= y <= height * 0.75 and width * 0.15 <= x <= width * 0.5:
                    r, g, b = 255, 0, 110

            raw_data.extend([r, g, b])

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
    ('logo-100x100.png', 100, 100, 'logo'),
    ('icon-24x24.png', 24, 24, 'icon'),
    ('discovery-300x200.png', 300, 200, 'discovery'),
    ('screenshot-1024x768.png', 1024, 768, 'screenshot'),
]

for filename, w, h, dtype in specs:
    path = os.path.join(out_dir, filename)
    with open(path, 'wb') as f:
        f.write(create_exact_png(w, h, dtype))
    print(f"Generated {filename} ({w}x{h})")

print("All exact Twitch extension asset PNGs generated!")
