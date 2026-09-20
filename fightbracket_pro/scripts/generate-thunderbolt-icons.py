import os
from PIL import Image, ImageDraw, ImageFont

def create_thunderbolt_logo(size=1000):
    img = Image.new("RGBA", (size, size), (5, 10, 20, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    
    border_w = int(size * 0.03)
    corner_r = int(size * 0.15)
    
    draw.rounded_rectangle([border_w, border_w, size - border_w, size - border_w], radius=corner_r, fill=(9, 19, 40, 255), outline=(0, 229, 255, 255), width=int(size * 0.02))
    draw.rounded_rectangle([border_w*2, border_w*2, size - border_w*2, size - border_w*2], radius=int(corner_r*0.9), fill=(5, 10, 20, 255))

    shield_pts = [
        (size * 0.5, size * 0.08),
        (size * 0.88, size * 0.25),
        (size * 0.88, size * 0.72),
        (size * 0.5, size * 0.92),
        (size * 0.12, size * 0.72),
        (size * 0.12, size * 0.25),
    ]
    draw.polygon(shield_pts, fill=(15, 25, 55, 220), outline=(255, 0, 110, 180), width=int(size * 0.015))

    # 1. TOP: Thunderbolt Symbol
    tb_w = size * 0.28
    tb_h = size * 0.32
    tb_cx = size * 0.5
    tb_top = size * 0.14
    
    hw = tb_w / 2
    tb_pts = [
        (tb_cx + hw * 0.15, tb_top),
        (tb_cx - hw * 0.85, tb_top + tb_h * 0.52),
        (tb_cx - hw * 0.05, tb_top + tb_h * 0.52),
        (tb_cx - hw * 0.45, tb_top + tb_h),
        (tb_cx + hw * 0.85, tb_top + tb_h * 0.42),
        (tb_cx + hw * 0.05, tb_top + tb_h * 0.42),
    ]
    
    draw.polygon(tb_pts, fill=(255, 230, 0, 255), outline=(0, 229, 255, 255), width=int(size * 0.02))
    
    # Fonts
    try:
        font_main = ImageFont.truetype("arialbd.ttf", int(size * 0.095))
        font_sub = ImageFont.truetype("arialbd.ttf", int(size * 0.085))
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    def draw_centered_text(text, center_x, center_y, font, text_color, shadow_color=(0, 0, 0, 230)):
        bbox = font.getbbox(text)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = center_x - (w / 2)
        y = center_y - (h / 2)
        draw.text((x + 4, y + 4), text, font=font, fill=shadow_color)
        draw.text((x - 2, y), text, font=font, fill=(0, 229, 255, 200))
        draw.text((x + 2, y), text, font=font, fill=(0, 229, 255, 200))
        draw.text((x, y), text, font=font, fill=text_color)

    # 2. MIDDLE: FightBracket Pro
    draw_centered_text("FightBracket Pro", size * 0.5, size * 0.58, font_main, (255, 255, 255, 255))
    
    # 3. BOTTOM: ESPORTS Banner & Text
    pill_w = size * 0.65
    pill_h = size * 0.14
    pill_x1 = (size - pill_w) / 2
    pill_y1 = size * 0.72
    pill_x2 = pill_x1 + pill_w
    pill_y2 = pill_y1 + pill_h
    
    draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=int(pill_h/2), fill=(255, 0, 110, 240), outline=(0, 229, 255, 255), width=int(size * 0.012))
    draw_centered_text("ESPORTS", size * 0.5, pill_y1 + (pill_h / 2), font_sub, (255, 255, 255, 255), shadow_color=(50, 0, 20, 255))

    return img

def create_discovery_banner(w=1200, h=800):
    img = Image.new("RGBA", (w, h), (5, 10, 20, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    
    draw.rectangle([0, 0, w, h], fill=(9, 19, 40, 255))
    draw.rectangle([20, 20, w-20, h-20], outline=(0, 229, 255, 255), width=6)
    
    draw.line([60, h*0.3, w*0.25, h*0.3], fill=(0, 229, 255, 100), width=4)
    draw.line([60, h*0.7, w*0.25, h*0.7], fill=(0, 229, 255, 100), width=4)
    draw.line([w*0.25, h*0.3, w*0.25, h*0.7], fill=(0, 229, 255, 100), width=4)
    
    draw.line([w-60, h*0.3, w*0.75, h*0.3], fill=(0, 229, 255, 100), width=4)
    draw.line([w-60, h*0.7, w*0.75, h*0.7], fill=(0, 229, 255, 100), width=4)
    draw.line([w*0.75, h*0.3, w*0.75, h*0.7], fill=(0, 229, 255, 100), width=4)
    
    tb_w = w * 0.16
    tb_h = h * 0.28
    tb_cx = w * 0.5
    tb_top = h * 0.12
    hw = tb_w / 2
    tb_pts = [
        (tb_cx + hw * 0.15, tb_top),
        (tb_cx - hw * 0.85, tb_top + tb_h * 0.52),
        (tb_cx - hw * 0.05, tb_top + tb_h * 0.52),
        (tb_cx - hw * 0.45, tb_top + tb_h),
        (tb_cx + hw * 0.85, tb_top + tb_h * 0.42),
        (tb_cx + hw * 0.05, tb_top + tb_h * 0.42),
    ]
    draw.polygon(tb_pts, fill=(255, 230, 0, 255), outline=(0, 229, 255, 255), width=8)

    try:
        font_main = ImageFont.truetype("arialbd.ttf", int(h * 0.12))
        font_sub = ImageFont.truetype("arialbd.ttf", int(h * 0.08))
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    def draw_centered_text(text, center_x, center_y, font, text_color):
        bbox = font.getbbox(text)
        w_t = bbox[2] - bbox[0]
        h_t = bbox[3] - bbox[1]
        x = center_x - (w_t / 2)
        y = center_y - (h_t / 2)
        draw.text((x + 4, y + 4), text, font=font, fill=(0, 0, 0, 230))
        draw.text((x, y), text, font=font, fill=text_color)

    draw_centered_text("FightBracket Pro", w * 0.5, h * 0.52, font_main, (255, 255, 255, 255))
    
    pill_w = w * 0.4
    pill_h = h * 0.16
    pill_x1 = (w - pill_w) / 2
    pill_y1 = h * 0.68
    draw.rounded_rectangle([pill_x1, pill_y1, pill_x1 + pill_w, pill_y1 + pill_h], radius=int(pill_h/2), fill=(255, 0, 110, 240), outline=(0, 229, 255, 255), width=4)
    draw_centered_text("ESPORTS", w * 0.5, pill_y1 + (pill_h / 2), font_sub, (255, 255, 255, 255))
    
    return img

def create_screenshot(w=2048, h=1536):
    img = Image.new("RGBA", (w, h), (10, 15, 30, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    
    draw.rectangle([0, 0, w, h], fill=(12, 18, 35, 255))
    draw.rectangle([40, 40, w-40, h-40], outline=(0, 229, 255, 255), width=8)
    
    logo_small = create_thunderbolt_logo(400)
    img.paste(logo_small, (80, 80), logo_small)
    
    panel_w = int(w * 0.38)
    panel_x1 = w - panel_w - 80
    panel_y1 = 80
    panel_x2 = w - 80
    panel_y2 = h - 80
    draw.rounded_rectangle([panel_x1, panel_y1, panel_x2, panel_y2], radius=30, fill=(15, 23, 42, 240), outline=(0, 229, 255, 255), width=6)
    
    try:
        font_title = ImageFont.truetype("arialbd.ttf", int(h * 0.04))
        font_text = ImageFont.truetype("arialbd.ttf", int(h * 0.025))
    except:
        font_title = ImageFont.load_default()
        font_text = ImageFont.load_default()
        
    draw.text((panel_x1 + 40, panel_y1 + 40), "LIVE MATCH STATS", font=font_title, fill=(0, 229, 255, 255))
    draw.text((panel_x1 + 40, panel_y1 + 120), "Grand Finals: Arslan Ash vs Knee", font=font_text, fill=(255, 255, 255, 255))
    draw.text((panel_x1 + 40, panel_y1 + 180), "Game 5 • Winner Takes All", font=font_text, fill=(255, 0, 110, 255))
    
    return img

out_dir = r'c:\projects\fightbracket_pro_extended\fightbracket_pro\public\twitch-extension\assets'
os.makedirs(out_dir, exist_ok=True)

logo_master = create_thunderbolt_logo(1000)
logo_master.resize((100, 100), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "logo-100x100.png"))
logo_master.resize((100, 100), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "logo-100x100-final.png"))

icon_24 = logo_master.resize((24, 24), Image.Resampling.LANCZOS)
icon_24.save(os.path.join(out_dir, "icon-24x24.png"))
icon_24.save(os.path.join(out_dir, "icon-24x24-final.png"))

disc_master = create_discovery_banner(1200, 800)
disc_master.resize((300, 200), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "discovery-300x200.png"))
disc_master.resize((300, 200), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "discovery-300x200-final.png"))

shot_master = create_screenshot(2048, 1536)
shot_master.resize((1024, 768), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "screenshot-1024x768.png"))
shot_master.resize((1024, 768), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "screenshot-1024x768-final.png"))

print("Successfully generated all exact Thunderbolt -> FightBracket Pro -> ESPORTS Twitch assets!")
