import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out_dir = r"C:/Users/win/Desktop/mobile/playstore_assets"
os.makedirs(out_dir, exist_ok=True)

art_dir = r"C:/Users/win/.gemini/antigravity/brain/97932d1b-dae8-4263-9ff3-947c13fb955d"

# Paths
logo_src = r"C:/Users/win/.gemini/antigravity/brain/97932d1b-dae8-4263-9ff3-947c13fb955d/.user_uploaded/media_1793335940590_ee13ab58.webp"
screens_dir = r"getaipilot-app/docs/design/screens"

# Fonts
font_title = ImageFont.truetype(r"C:/Windows/Fonts/segoeuib.ttf", 64)
font_subtitle = ImageFont.truetype(r"C:/Windows/Fonts/segoeui.ttf", 36)
font_badge = ImageFont.truetype(r"C:/Windows/Fonts/segoeuib.ttf", 26)
font_feat_title = ImageFont.truetype(r"C:/Windows/Fonts/segoeuib.ttf", 52)
font_feat_sub = ImageFont.truetype(r"C:/Windows/Fonts/segoeui.ttf", 24)
font_feat_pill = ImageFont.truetype(r"C:/Windows/Fonts/segoeuib.ttf", 18)

# Load Logo and crop tightly
logo_img = Image.open(logo_src).convert("RGBA")
bbox = logo_img.getbbox()
logo_tight = logo_img.crop(bbox)
tw, th = logo_tight.size

def get_scaled_logo(target_dim):
    if tw > th:
        nw = target_dim
        nh = int(th * (target_dim / tw))
    else:
        nh = target_dim
        nw = int(tw * (target_dim / th))
    return logo_tight.resize((nw, nh), Image.Resampling.LANCZOS)

# -------------------------------------------------------------
# 1. GOOGLE PLAY STORE ICON (512 x 512)
# -------------------------------------------------------------
print("Generating 512x512 App Icon...")
icon_canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
scaled_logo = get_scaled_logo(430)
sw, sh = scaled_logo.size
icon_canvas.paste(scaled_logo, ((512 - sw) // 2, (512 - sh) // 2), scaled_logo)
icon_path = os.path.join(out_dir, "01_playstore_icon_512x512.png")
icon_canvas.save(icon_path, "PNG")
icon_canvas.save(os.path.join(art_dir, "playstore_icon_512x512.png"), "PNG")

# -------------------------------------------------------------
# 2. FEATURE GRAPHIC (1024 x 500)
# -------------------------------------------------------------
print("Generating 1024x500 Feature Graphic...")
feat_bg = Image.new("RGB", (1024, 500), (14, 11, 26))

draw_feat = ImageDraw.Draw(feat_bg)
for y in range(500):
    factor = y / 500.0
    r = int(15 + factor * 10)
    g = int(12 + factor * 8)
    b = int(28 + factor * 26)
    draw_feat.line([(0, y), (1024, y)], fill=(r, g, b))

# Add ambient glowing radial circles
ambient = Image.new("RGBA", (1024, 500), (0, 0, 0, 0))
amb_draw = ImageDraw.Draw(ambient)
amb_draw.ellipse([(-100, -100), (450, 450)], fill=(112, 85, 232, 60))
amb_draw.ellipse([(600, 100), (1150, 600)], fill=(232, 62, 145, 50))
ambient = ambient.filter(ImageFilter.GaussianBlur(80))
feat_bg.paste(ambient, (0, 0), ambient)

# Left Side: Logo + Branding + Tagline + Pills
feat_logo = get_scaled_logo(130)
feat_bg.paste(feat_logo, (64, 80), feat_logo)

draw_feat = ImageDraw.Draw(feat_bg)
draw_feat.text((214, 82), "GetAiPilot", fill=(255, 255, 255), font=font_feat_title)
draw_feat.text((216, 145), "AI Growth & Automation Platform", fill=(195, 185, 240), font=font_feat_sub)

desc_lines = [
    "Scale social channels, deploy conversational voice agents,",
    "automate WhatsApp & Telegram campaigns, and manage leads."
]
draw_feat.text((64, 230), desc_lines[0], fill=(220, 222, 235), font=ImageFont.truetype(r"C:/Windows/Fonts/segoeui.ttf", 20))
draw_feat.text((64, 260), desc_lines[1], fill=(160, 165, 185), font=ImageFont.truetype(r"C:/Windows/Fonts/segoeui.ttf", 20))

# Feature badges
badges = ["SocialPilot", "Voice AI", "WhatsApp", "Telegram", "Smart CRM"]
bx = 64
by = 330
for b in badges:
    bbox_b = draw_feat.textbbox((0, 0), b, font=font_feat_pill)
    bw = bbox_b[2] - bbox_b[0] + 28
    bh = 34
    draw_feat.rounded_rectangle([bx, by, bx + bw, by + bh], radius=17, fill=(38, 30, 65), outline=(95, 75, 175), width=1)
    draw_feat.text((bx + 14, by + 7), b, fill=(240, 235, 255), font=font_feat_pill)
    bx += bw + 12

# Right Side: Device phone mockup with SocialPilot screen
mockup_w, mockup_h = 240, 480
try:
    screen_raw = Image.open(os.path.join(screens_dir, "social.webp")).convert("RGBA")
    screen_scaled = screen_raw.resize((mockup_w, int(mockup_w * 844 / 390)), Image.Resampling.LANCZOS)
    
    # Phone frame
    frame = Image.new("RGBA", (mockup_w + 14, 460), (28, 26, 38, 255))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle([0, 0, mockup_w + 13, 459], radius=32, fill=(20, 18, 30), outline=(80, 70, 110), width=3)
    
    # Crop screen to fit frame
    screen_cropped = screen_scaled.crop((0, 0, mockup_w, 440))
    # Round screen corners
    mask = Image.new("L", (mockup_w, 440), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, mockup_w, 440], radius=24, fill=255)
    frame.paste(screen_cropped, (7, 10), mask)
    
    # Shadow under frame
    shadow = Image.new("RGBA", (frame.width + 40, frame.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([15, 15, frame.width + 25, frame.height + 25], radius=36, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    
    feat_bg.paste(shadow, (720, 40), shadow)
    feat_bg.paste(frame, (735, 55), frame)
except Exception as e:
    print("Mockup right error:", e)

feat_path = os.path.join(out_dir, "02_playstore_feature_graphic_1024x500.png")
feat_bg.save(feat_path, "PNG")
feat_bg.save(os.path.join(art_dir, "playstore_feature_graphic_1024x500.png"), "PNG")

# -------------------------------------------------------------
# 3. PLAY STORE SCREENSHOTS (1080 x 2400)
# -------------------------------------------------------------
screenshot_configs = [
    {
        "filename": "03_screenshot_1_social.png",
        "tag": "SOCIAL MEDIA SUITE",
        "title": "Discover Viral Trends\n& Auto-Schedule Posts",
        "subtitle": "Multi-channel publishing for Instagram, Facebook, X, & LinkedIn",
        "screen": "social.webp",
        "accent": (232, 62, 145),
        "bg_top": (18, 14, 32),
        "bg_bottom": (35, 20, 48)
    },
    {
        "filename": "04_screenshot_2_voice.png",
        "tag": "VOICE AI AUTOMATION",
        "title": "Autonomous AI Agents\nFor Inbound & Outbound",
        "subtitle": "Natural voice conversations, campaign calls & live call analytics",
        "screen": "voice.webp",
        "accent": (112, 85, 232),
        "bg_top": (14, 16, 35),
        "bg_bottom": (24, 30, 60)
    },
    {
        "filename": "05_screenshot_3_whatsapp.png",
        "tag": "OMNICHANNEL MESSAGING",
        "title": "WhatsApp & Telegram\nCampaign Broadcasts",
        "subtitle": "Smart audience reach, official Meta API & 24/7 automated flows",
        "screen": "whatsapp.webp",
        "accent": (37, 211, 102),
        "bg_top": (10, 24, 20),
        "bg_bottom": (18, 45, 36)
    },
    {
        "filename": "06_screenshot_4_crm.png",
        "tag": "LEAD MANAGEMENT",
        "title": "Close Deals Faster With\nSmart Integrated CRM",
        "subtitle": "Custom pipeline stages, lead activity history & revenue tracking",
        "screen": "crm.webp",
        "accent": (245, 158, 11),
        "bg_top": (28, 20, 14),
        "bg_bottom": (45, 32, 18)
    },
    {
        "filename": "07_screenshot_5_telegram.png",
        "tag": "COMMUNITY GROWTH",
        "title": "Telegram Bots & Feeds\nFull Auto-Forwarding",
        "subtitle": "Automate reactions, manage subscribers & signal channels effortlessly",
        "screen": "telegram.webp",
        "accent": (42, 171, 238),
        "bg_top": (12, 22, 34),
        "bg_bottom": (18, 38, 56)
    }
]

def make_phone_mockup(screen_img_path, target_w=820):
    raw = Image.open(screen_img_path).convert("RGBA")
    rw, rh = raw.size
    target_h = int(target_w * rh / rw)
    scaled = raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Outer bezel dimensions
    bezel_pad = 20
    bw = target_w + (bezel_pad * 2)
    bh = target_h + (bezel_pad * 2)
    
    bezel = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bezel)
    # Phone outer frame
    b_draw.rounded_rectangle([0, 0, bw, bh], radius=68, fill=(24, 25, 32), outline=(70, 75, 95), width=4)
    # Inner border
    b_draw.rounded_rectangle([bezel_pad - 2, bezel_pad - 2, bw - bezel_pad + 2, bh - bezel_pad + 2], radius=50, outline=(40, 42, 52), width=2)
    
    # Screen with rounded corners
    s_mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(s_mask).rounded_rectangle([0, 0, target_w, target_h], radius=48, fill=255)
    bezel.paste(scaled, (bezel_pad, bezel_pad), s_mask)
    
    # Dynamic Island / Camera punch hole at top
    cam_w, cam_h = 160, 36
    cam_x = (bw - cam_w) // 2
    cam_y = bezel_pad + 12
    b_draw.rounded_rectangle([cam_x, cam_y, cam_x + cam_w, cam_y + cam_h], radius=18, fill=(10, 10, 12))
    b_draw.ellipse([cam_x + 18, cam_y + 10, cam_x + 34, cam_y + 26], fill=(25, 25, 45))
    
    return bezel

print("Rendering 5 high-resolution Play Store screenshots (1080 x 2400)...")

for idx, cfg in enumerate(screenshot_configs):
    canvas = Image.new("RGB", (1080, 2400), cfg["bg_top"])
    c_draw = ImageDraw.Draw(canvas)
    
    # Vertical gradient
    for y in range(2400):
        factor = y / 2400.0
        r = int(cfg["bg_top"][0] + factor * (cfg["bg_bottom"][0] - cfg["bg_top"][0]))
        g = int(cfg["bg_top"][1] + factor * (cfg["bg_bottom"][1] - cfg["bg_top"][1]))
        b = int(cfg["bg_top"][2] + factor * (cfg["bg_bottom"][2] - cfg["bg_top"][2]))
        c_draw.line([(0, y), (1080, y)], fill=(r, g, b))
        
    # Ambient light
    ambient = Image.new("RGBA", (1080, 2400), (0, 0, 0, 0))
    a_draw = ImageDraw.Draw(ambient)
    a_draw.ellipse([(140, 650), (940, 1450)], fill=(*cfg["accent"], 70))
    a_draw.ellipse([(-200, -200), (600, 600)], fill=(112, 85, 232, 45))
    ambient = ambient.filter(ImageFilter.GaussianBlur(140))
    canvas.paste(ambient, (0, 0), ambient)
    
    c_draw = ImageDraw.Draw(canvas)
    
    # Header Category Tag Pill
    tag_text = cfg["tag"]
    bbox_tag = c_draw.textbbox((0, 0), tag_text, font=font_badge)
    tag_w = bbox_tag[2] - bbox_tag[0] + 36
    tag_h = 50
    tag_x = (1080 - tag_w) // 2
    tag_y = 130
    c_draw.rounded_rectangle([tag_x, tag_y, tag_x + tag_w, tag_y + tag_h], radius=25, fill=(35, 30, 52), outline=(*cfg["accent"], 220), width=2)
    c_draw.text((tag_x + 18, tag_y + 10), tag_text, fill=(*cfg["accent"], 255), font=font_badge)
    
    # Main Headline
    lines = cfg["title"].split("\n")
    ty = 220
    for line in lines:
        bbox_l = c_draw.textbbox((0, 0), line, font=font_title)
        lw = bbox_l[2] - bbox_l[0]
        c_draw.text(((1080 - lw) // 2, ty), line, fill=(255, 255, 255), font=font_title)
        ty += 80
        
    # Subtitle
    sub_line = cfg["subtitle"]
    bbox_s = c_draw.textbbox((0, 0), sub_line, font=font_subtitle)
    sw = bbox_s[2] - bbox_s[0]
    c_draw.text(((1080 - sw) // 2, ty + 10), sub_line, fill=(185, 190, 210), font=font_subtitle)
    
    # Phone mockup
    screen_file = os.path.join(screens_dir, cfg["screen"])
    phone = make_phone_mockup(screen_file, target_w=820)
    
    # Phone drop shadow
    shadow_w = phone.width + 80
    shadow_h = phone.height + 80
    shadow = Image.new("RGBA", (shadow_w, shadow_h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([30, 30, shadow_w - 30, shadow_h - 30], radius=80, fill=(0, 0, 0, 180))
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    
    px = (1080 - phone.width) // 2
    py = 480
    canvas.paste(shadow, (px - 40, py - 30), shadow)
    canvas.paste(phone, (px, py), phone)
    
    sp = os.path.join(out_dir, cfg["filename"])
    canvas.save(sp, "PNG")
    canvas.save(os.path.join(art_dir, cfg["filename"]), "PNG")
    print(f"Saved: {cfg['filename']}")

print("\n--- ALL PLAY STORE GRAPHICS GENERATED SUCCESSFULLY! ---")

