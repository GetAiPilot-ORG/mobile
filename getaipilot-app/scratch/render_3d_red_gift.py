import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# High resolution supersampling canvas (4x: 512x512, downsampled to 256x256)
S = 512
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))

# Coordinates
cx = 256
cy = 310
bw = 145  # half width
bh = 135  # box body height
ty = 65   # top face perspective slope
lid_drop = 35 # lid overhang height

# Key 3D Vertices
# Box Body
p_top_back = (cx, cy - bh - ty)
p_top_right = (cx + bw, cy - bh)
p_top_front = (cx, cy - bh + ty)
p_top_left = (cx - bw, cy - bh)

p_bot_left = (cx - bw, cy)
p_bot_front = (cx, cy + ty)
p_bot_right = (cx + bw, cy)

# Lid vertices (slightly wider: +8px)
lw = bw + 8
p_lid_back = (cx, cy - bh - ty - 4)
p_lid_right = (cx + lw, cy - bh - 4)
p_lid_front = (cx, cy - bh + ty - 4)
p_lid_left = (cx - lw, cy - bh - 4)

p_lid_rim_left = (cx - lw, cy - bh - 4 + lid_drop)
p_lid_rim_front = (cx, cy - bh + ty - 4 + lid_drop)
p_lid_rim_right = (cx + lw, cy - bh - 4 + lid_drop)

# Helper to draw gradient polygon
def draw_grad_poly(base_img, poly, col1, col2, is_vertical=True):
    temp = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(temp)
    tdraw.polygon(poly, fill=(255, 255, 255, 255))
    
    mask = np.array(temp)[:, :, 3] > 0
    if not np.any(mask):
        return
    y_idx, x_idx = np.where(mask)
    y_min, y_max = y_idx.min(), y_idx.max()
    x_min, x_max = x_idx.min(), x_idx.max()
    
    grad = np.zeros((S, S, 4), dtype=np.uint8)
    for y in range(y_min, y_max + 1):
        for x in range(x_min, x_max + 1):
            if mask[y, x]:
                if is_vertical:
                    t = (y - y_min) / max(1, (y_max - y_min))
                else:
                    t = (x - x_min) / max(1, (x_max - x_min))
                r = int(col1[0] * (1 - t) + col2[0] * t)
                g = int(col1[1] * (1 - t) + col2[1] * t)
                b = int(col1[2] * (1 - t) + col2[2] * t)
                grad[y, x] = [r, g, b, 255]
    
    grad_img = Image.fromarray(grad)
    base_img.alpha_composite(grad_img)

# 1. Box Body - Left Face (Crimson Red: #E11D48 -> #BE123C)
left_poly = [p_top_left, p_top_front, p_bot_front, p_bot_left]
draw_grad_poly(img, left_poly, (235, 38, 78), (170, 15, 45), is_vertical=True)

# 2. Box Body - Right Face (Deep Ruby/Burgundy Red: #BE123C -> #881337)
right_poly = [p_top_front, p_top_right, p_bot_right, p_bot_front]
draw_grad_poly(img, right_poly, (190, 20, 55), (120, 10, 35), is_vertical=True)

# 3. Soft drop shadow under lid
lid_shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ls_draw = ImageDraw.Draw(lid_shadow)
ls_poly_left = [p_lid_rim_left, p_lid_rim_front, (p_lid_rim_front[0], p_lid_rim_front[1] + 18), (p_lid_rim_left[0], p_lid_rim_left[1] + 18)]
ls_poly_right = [p_lid_rim_front, p_lid_rim_right, (p_lid_rim_right[0], p_lid_rim_right[1] + 18), (p_lid_rim_front[0], p_lid_rim_front[1] + 18)]
ls_draw.polygon(ls_poly_left, fill=(0, 0, 0, 110))
ls_draw.polygon(ls_poly_right, fill=(0, 0, 0, 140))
lid_shadow = lid_shadow.filter(ImageFilter.GaussianBlur(radius=6))
img.alpha_composite(lid_shadow)

# 4. Box Lid Rim - Left Face (Glossy Vivid Red: #F43F5E -> #DC2626)
lid_rim_left = [p_lid_left, p_lid_front, p_lid_rim_front, p_lid_rim_left]
draw_grad_poly(img, lid_rim_left, (250, 60, 95), (200, 25, 55), is_vertical=True)

# 5. Box Lid Rim - Right Face (Deeper Vivid Red: #DC2626 -> #991B1B)
lid_rim_right = [p_lid_front, p_lid_right, p_lid_rim_right, p_lid_rim_front]
draw_grad_poly(img, lid_rim_right, (215, 30, 60), (145, 15, 40), is_vertical=True)

# 6. Box Lid Top Face (Illuminated Bright Ruby Red: #FB7185 -> #E11D48)
lid_top = [p_lid_back, p_lid_right, p_lid_front, p_lid_left]
draw_grad_poly(img, lid_top, (255, 110, 135), (225, 35, 75), is_vertical=True)

# 7. Emerald Green & Gold Luxury Ribbon Across Box
def lerp(p1, p2, t):
    return (int(p1[0]*(1-t) + p2[0]*t), int(p1[1]*(1-t) + p2[1]*t))

# Ribbon Left Body
rb_tl = lerp(p_top_left, p_top_front, 0.42)
rb_tr = lerp(p_top_left, p_top_front, 0.58)
rb_bl = lerp(p_bot_left, p_bot_front, 0.42)
rb_br = lerp(p_bot_left, p_bot_front, 0.58)
draw_grad_poly(img, [rb_tl, rb_tr, rb_br, rb_bl], (16, 185, 129), (5, 120, 80), is_vertical=True)

# Ribbon Right Body
rc_tl = lerp(p_top_front, p_top_right, 0.42)
rc_tr = lerp(p_top_front, p_top_right, 0.58)
rc_bl = lerp(p_bot_front, p_bot_right, 0.42)
rc_br = lerp(p_bot_front, p_bot_right, 0.58)
draw_grad_poly(img, [rc_tl, rc_tr, rc_br, rc_bl], (10, 160, 110), (4, 90, 60), is_vertical=True)

# Ribbon Left Lid Rim
rl_tl = lerp(p_lid_left, p_lid_front, 0.42)
rl_tr = lerp(p_lid_left, p_lid_front, 0.58)
rl_bl = lerp(p_lid_rim_left, p_lid_rim_front, 0.42)
rl_br = lerp(p_lid_rim_left, p_lid_rim_front, 0.58)
draw_grad_poly(img, [rl_tl, rl_tr, rl_br, rl_bl], (34, 211, 153), (16, 165, 115), is_vertical=True)

# Ribbon Right Lid Rim
rr_tl = lerp(p_lid_front, p_lid_right, 0.42)
rr_tr = lerp(p_lid_front, p_lid_right, 0.58)
rr_bl = lerp(p_lid_rim_front, p_lid_rim_right, 0.42)
rr_br = lerp(p_lid_rim_front, p_lid_rim_right, 0.58)
draw_grad_poly(img, [rr_tl, rr_tr, rr_br, rr_bl], (16, 175, 120), (5, 115, 75), is_vertical=True)

# Ribbon on Lid Top (Crossing bands)
t1_a = lerp(p_lid_back, p_lid_right, 0.42)
t1_b = lerp(p_lid_back, p_lid_right, 0.58)
t1_c = lerp(p_lid_left, p_lid_front, 0.58)
t1_d = lerp(p_lid_left, p_lid_front, 0.42)
draw_grad_poly(img, [t1_a, t1_b, t1_c, t1_d], (52, 211, 153), (16, 185, 129), is_vertical=True)

t2_a = lerp(p_lid_back, p_lid_left, 0.42)
t2_b = lerp(p_lid_back, p_lid_left, 0.58)
t2_c = lerp(p_lid_right, p_lid_front, 0.58)
t2_d = lerp(p_lid_right, p_lid_front, 0.42)
draw_grad_poly(img, [t2_a, t2_b, t2_c, t2_d], (52, 211, 153), (16, 185, 129), is_vertical=True)

# 8. Luxury 3D Ribbon Bow on Top with Gold Highlights
bow_canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(bow_canvas)
bow_cx = cx
bow_cy = cy - bh - 4

# Left Bow Loop
bdraw.ellipse([bow_cx - 65, bow_cy - 48, bow_cx - 6, bow_cy + 8], fill=(16, 185, 129, 255), outline=(52, 211, 153, 255), width=3)
bdraw.ellipse([bow_cx - 48, bow_cy - 34, bow_cx - 20, bow_cy - 8], fill=(6, 95, 70, 255))

# Right Bow Loop
bdraw.ellipse([bow_cx + 6, bow_cy - 48, bow_cx + 65, bow_cy + 8], fill=(16, 185, 129, 255), outline=(52, 211, 153, 255), width=3)
bdraw.ellipse([bow_cx + 20, bow_cy - 34, bow_cx + 48, bow_cy - 8], fill=(6, 95, 70, 255))

# Ribbon Tails
bdraw.polygon([(bow_cx - 15, bow_cy + 4), (bow_cx - 48, bow_cy + 46), (bow_cx - 28, bow_cy + 44), (bow_cx - 2, bow_cy + 8)], fill=(16, 185, 129, 255))
bdraw.polygon([(bow_cx + 15, bow_cy + 4), (bow_cx + 48, bow_cy + 46), (bow_cx + 28, bow_cy + 44), (bow_cx + 2, bow_cy + 8)], fill=(16, 185, 129, 255))

# Center Gold Knot Medallion
bdraw.ellipse([bow_cx - 18, bow_cy - 16, bow_cx + 18, bow_cy + 16], fill=(245, 158, 11, 255), outline=(253, 230, 138, 255), width=3)
bdraw.ellipse([bow_cx - 11, bow_cy - 10, bow_cx + 11, bow_cy + 10], fill=(217, 119, 6, 255))

img.alpha_composite(bow_canvas)

# 9. Fine Specular Highlight Lines along Box and Lid Edges
hlight = Image.new('RGBA', (S, S), (0, 0, 0, 0))
hdraw = ImageDraw.Draw(hlight)
hdraw.line([p_lid_left, p_lid_front], fill=(255, 255, 255, 160), width=2)
hdraw.line([p_lid_front, p_lid_right], fill=(255, 255, 255, 110), width=2)
hdraw.line([p_bot_front, p_top_front], fill=(255, 255, 255, 80), width=2)
img.alpha_composite(hlight)

# Trim bounding box tightly
bbox = img.getbbox()
pad = 6
crop_box = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(S, bbox[2]+pad), min(S, bbox[3]+pad))
trimmed = img.crop(crop_box)

# High quality downsampling with Lanczos filter for razor-sharp anti-aliasing
target_w = 230
target_h = int(trimmed.height * (target_w / trimmed.width))
final_img = trimmed.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Save both as referral-gift-red.png and update referral-gift-only.png
final_img.save('assets/images/referral-gift-red.png')
final_img.save('assets/images/referral-gift-only.png')
print(f'Successfully generated 3D Red Gift Box! Dimensions: {final_img.size}')
