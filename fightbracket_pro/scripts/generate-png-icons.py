import os
import zlib
import struct

def make_png(width, height, color_bg, color_accent, text_type="FB"):
    # Raw RGB image buffer
    raw_data = bytearray()
    
    r_bg, g_bg, b_bg = color_bg
    r_ac, g_ac, b_ac = color_accent
    r_fg, g_fg, b_fg = (255, 255, 255)
    r_border, g_border, b_border = (0, 229, 255)

    border_thick = max(1, width // 30)

    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            # Border check
            is_border = (x < border_thick or x >= width - border_thick or y < border_thick or y >= height - border_thick)
            
            # Simple logo graphic check
            is_center = (width * 0.25 <= x <= width * 0.75 and height * 0.25 <= y <= height * 0.75)
            
            if is_border:
                raw_data.extend([r_border, g_border, b_border])
            elif is_center:
                raw_data.extend([r_ac, g_ac, b_ac])
            else:
                raw_data.extend([r_bg, g_bg, b_bg])

    # Compress IDAT chunk
    compressed = zlib.compress(raw_data)
    
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    
    return header + ihdr + idat + iend

os.makedirs('public/twitch-extension/assets', exist_ok=True)

with open('public/twitch-extension/assets/logo-100x100.png', 'wb') as f:
    f.write(make_png(100, 100, (5, 10, 20), (255, 0, 110)))

with open('public/twitch-extension/assets/icon-24x24.png', 'wb') as f:
    f.write(make_png(24, 24, (5, 10, 20), (255, 0, 110)))

with open('public/twitch-extension/assets/discovery-600x300.png', 'wb') as f:
    f.write(make_png(600, 300, (5, 10, 20), (0, 229, 255)))

print("Pure PNG icons generated successfully!")
