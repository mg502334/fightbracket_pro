import os
from PIL import Image, ImageDraw, ImageFont

def draw_text_with_shadow(draw, text, position, font, text_color, shadow_color=(0, 0, 0, 180)):
    x, y = position
    # Draw shadow
    draw.text((x + 2, y + 2), text, font=font, fill=shadow_color, anchor="mm")
    # Draw text
    draw.text((x, y), text, font=font, fill=text_color, anchor="mm")

def process_and_add_text_bubble(image_path, output_path, target_width, target_height, text_main, text_sub, text_y_ratio=0.8):
    img = Image.open(image_path).convert("RGBA")
    
    # Calculate target aspect ratio
    target_ratio = target_width / target_height
    img_ratio = img.width / img.height
    
    if img_ratio > target_ratio:
        # Crop width
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) / 2
        img = img.crop((left, 0, left + new_width, img.height))
    elif img_ratio < target_ratio:
        # Crop height
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) / 2
        img = img.crop((0, top, img.width, top + new_height))
        
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(img, "RGBA")
    
    # Try to load a bold font
    try:
        font_main = ImageFont.truetype("arialbd.ttf", int(target_height * 0.12))
        font_sub = ImageFont.truetype("arialbd.ttf", int(target_height * 0.06))
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    center_x = target_width / 2
    y_main = target_height * text_y_ratio
    
    # Instead of a giant square, draw a sleek "bubble" / pill shape around the text!
    # This covers "Neon Arc" beautifully without ruining the whole background.
    if text_main:
        # Estimate text width
        try:
            bbox = font_main.getbbox(text_main)
            text_w = bbox[2] - bbox[0]
        except:
            text_w = target_width * 0.8
            
        pill_w = text_w + (target_width * 0.1)
        pill_h = target_height * 0.25
        
        pill_x1 = center_x - (pill_w / 2)
        pill_y1 = y_main - (pill_h / 2)
        pill_x2 = center_x + (pill_w / 2)
        pill_y2 = y_main + (pill_h / 2)
        
        # Draw the rounded rectangle bubble
        draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=int(pill_h/2), fill=(15, 23, 42, 240), outline=(0, 229, 255, 255), width=3)
        
        draw_text_with_shadow(draw, text_main, (center_x, y_main - (target_height * 0.03)), font_main, (255, 255, 255, 255))
        if text_sub:
            draw_text_with_shadow(draw, text_sub, (center_x, y_main + (target_height * 0.05)), font_sub, (255, 0, 110, 255))

    img.save(output_path, format="PNG")
    print(f"Saved {output_path} with bubble text overlay.")

brain_dir = r"C:\Users\Michelle\.gemini\antigravity-ide\brain\804d3970-e534-4279-ad64-0968432ca563"
out_dir = r"C:\projects\fightbracket_pro_extended\fightbracket_pro\public\twitch-extension\assets"
os.makedirs(out_dir, exist_ok=True)

# Use the VERY FIRST AI generated images which the user liked (before the text was covered with a boring box)
logo_src = os.path.join(brain_dir, "esports_thunderbolt_logo_1785695658891.png")
banner_src = os.path.join(brain_dir, "esports_discovery_banner_1785695674536.png")
screenshot_src = os.path.join(brain_dir, "esports_stream_screenshot_1785695722696.png")

# 1. Logo (100x100) - No text, just crop it so we keep the awesome raw AI logo!
img_logo = Image.open(logo_src).convert("RGBA").resize((100, 100), Image.Resampling.LANCZOS)
img_logo.save(os.path.join(out_dir, "logo-100x100.png"), format="PNG")

# 2. Icon (24x24) - No text
img_icon = Image.open(logo_src).convert("RGBA").resize((24, 24), Image.Resampling.LANCZOS)
img_icon.save(os.path.join(out_dir, "icon-24x24.png"), format="PNG")

# 3. Discovery Banner (300x200) - Cool Bubble Text!
process_and_add_text_bubble(banner_src, os.path.join(out_dir, "discovery-300x200.png"), 300, 200, "FightBracket Pro", "ESPORTS", 0.75)

# 4. Screenshot (1024x768) - Cool Bubble Text!
process_and_add_text_bubble(screenshot_src, os.path.join(out_dir, "screenshot-1024x768.png"), 1024, 768, "FightBracket Pro", "ESPORTS", 0.75)

print("Images regenerated with sleek text bubbles!")
