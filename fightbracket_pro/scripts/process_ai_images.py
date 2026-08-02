import os
from PIL import Image, ImageDraw, ImageFont

def draw_text_with_shadow(draw, text, position, font, text_color, shadow_color=(0, 0, 0, 180)):
    x, y = position
    # Draw shadow
    draw.text((x + 2, y + 2), text, font=font, fill=shadow_color, anchor="mm")
    # Draw text
    draw.text((x, y), text, font=font, fill=text_color, anchor="mm")

def process_and_add_text(image_path, output_path, target_width, target_height, text_main, text_sub, text_y_ratio=0.8):
    img = Image.open(image_path).convert("RGBA")
    
    # Calculate target aspect ratio
    target_ratio = target_width / target_height
    img_ratio = img.width / img.height
    
    if img_ratio > target_ratio:
        # Image is wider than target ratio
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) / 2
        top = 0
        right = left + new_width
        bottom = img.height
        img = img.crop((left, top, right, bottom))
    elif img_ratio < target_ratio:
        # Image is taller than target ratio
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) / 2
        left = 0
        bottom = top + new_height
        right = img.width
        img = img.crop((left, top, right, bottom))
        
    # Resize
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Draw a gradient or semi-transparent dark box at the bottom to cover AI text
    draw = ImageDraw.Draw(img, "RGBA")
    box_top = int(target_height * 0.65)
    draw.rectangle([0, box_top, target_width, target_height], fill=(5, 10, 20, 230))
    
    # Try to load a bold font
    try:
        font_main = ImageFont.truetype("arialbd.ttf", int(target_height * 0.12))
        font_sub = ImageFont.truetype("arialbd.ttf", int(target_height * 0.06))
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    center_x = target_width / 2
    y_main = target_height * text_y_ratio
    
    if text_main:
        draw_text_with_shadow(draw, text_main, (center_x, y_main - (target_height * 0.05)), font_main, (255, 255, 255, 255))
    if text_sub:
        draw_text_with_shadow(draw, text_sub, (center_x, y_main + (target_height * 0.06)), font_sub, (0, 229, 255, 255))

    img.save(output_path, format="PNG")
    print(f"Saved {output_path} with size {target_width}x{target_height} and text overlay.")

brain_dir = r"C:\Users\Michelle\.gemini\antigravity-ide\brain\804d3970-e534-4279-ad64-0968432ca563"
out_dir = r"C:\projects\fightbracket_pro_extended\fightbracket_pro\public\twitch-extension\assets"
os.makedirs(out_dir, exist_ok=True)

# Use the generated images
logo_src = os.path.join(brain_dir, "esports_thunderbolt_logo_1785695658891.png")
banner_src = os.path.join(brain_dir, "esports_discovery_banner_1785695674536.png")
screenshot_src = os.path.join(brain_dir, "esports_stream_screenshot_1785695722696.png")

# 1. Logo (100x100) - Just the graphic, no text to keep it clean at small size
# But user wanted text on it if there was Neon Arc. Let's cover bottom and put FB PRO.
process_and_add_text(logo_src, os.path.join(out_dir, "logo-100x100.png"), 100, 100, "FB", "PRO", 0.75)

# 2. Icon (24x24) - Too small for text, just crop
img_icon = Image.open(logo_src).convert("RGBA").resize((24, 24), Image.Resampling.LANCZOS)
img_icon.save(os.path.join(out_dir, "icon-24x24.png"), format="PNG")
print("Saved icon-24x24.png")

# 3. Discovery Banner (300x200) - Full text!
process_and_add_text(banner_src, os.path.join(out_dir, "discovery-300x200.png"), 300, 200, "FightBracket Pro", "ESPORTS", 0.8)

# 4. Screenshot (1024x768) - Full text!
process_and_add_text(screenshot_src, os.path.join(out_dir, "screenshot-1024x768.png"), 1024, 768, "FightBracket Pro", "ESPORTS EXTENSION", 0.8)

print("Finished processing all images with correct text!")
