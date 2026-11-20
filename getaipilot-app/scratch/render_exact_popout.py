import math
import struct
import os

WIDTH = 300
HEIGHT = 340
NUM_FRAMES = 36
DELAY_CS = 6
TRANSPARENT_IDX = 0

palette = [(0, 0, 0)]  # Index 0: Transparent

def add_color(r, g, b):
    palette.append((
        max(0, min(255, int(r))),
        max(0, min(255, int(g))),
        max(0, min(255, int(b)))
    ))

# 1. Purple & Lavender Palette (bags, card, phone rim) (1 to 75)
for i in range(75):
    t = i / 74.0
    if t < 0.45:
        s = t / 0.45
        r = int(45 + 85 * s)
        g = int(15 + 45 * s)
        b = int(90 + 130 * s)
    elif t < 0.8:
        s = (t - 0.45) / 0.35
        r = int(130 + 95 * s)
        g = int(60 + 110 * s)
        b = int(220 + 35 * s)
    else:
        s = (t - 0.8) / 0.2
        r = int(225 + 30 * s)
        g = int(170 + 85 * s)
        b = 255
    add_color(r, g, b)

# 2. Golden / Bronze Bag & Accents (76 to 135)
for i in range(60):
    t = i / 59.0
    if t < 0.5:
        s = t / 0.5
        r = int(140 + 75 * s)
        g = int(80 + 60 * s)
        b = int(15 + 15 * s)
    elif t < 0.85:
        s = (t - 0.5) / 0.35
        r = int(215 + 35 * s)
        g = int(140 + 80 * s)
        b = int(30 + 80 * s)
    else:
        s = (t - 0.85) / 0.15
        r = 255
        g = int(220 + 35 * s)
        b = int(110 + 145 * s)
    add_color(r, g, b)

# 3. Headphone White & Silver Gray (136 to 180)
for i in range(45):
    t = i / 44.0
    val = int(80 + 175 * t)
    add_color(val * 0.95, val * 0.95, val)

# 4. Phone Screen Light Pastel Tiles (181 to 215)
# Tile background (soft lavender/pinkish gray)
for i in range(35):
    t = i / 34.0
    r = int(210 + 40 * t)
    g = int(195 + 50 * t)
    b = int(230 + 25 * t)
    add_color(r, g, b)

# 5. Soft Ground Shadow & Floor Reflection (216 to 255)
for i in range(40):
    t = i / 39.0
    r = int(25 * (1.0 - t))
    g = int(20 * (1.0 - t))
    b = int(45 * (1.0 - t))
    add_color(r, g, b)

while len(palette) < 256:
    palette.append((0, 0, 0))

# Precompute Color Cache
CACHE_STEP = 8
color_cache = {}

def find_color_index(r, g, b):
    best_dist = 99999999
    best_idx = 1
    for idx in range(1, 256):
        pr, pg, pb = palette[idx]
        dr = r - pr
        dg = g - pg
        db = b - pb
        dist = dr*dr*2 + dg*dg*4 + db*db*3
        if dist < best_dist:
            best_dist = dist
            best_idx = idx
            if dist == 0:
                break
    return best_idx

for r_step in range(0, 256 + CACHE_STEP, CACHE_STEP):
    for g_step in range(0, 256 + CACHE_STEP, CACHE_STEP):
        for b_step in range(0, 256 + CACHE_STEP, CACHE_STEP):
            color_cache[(r_step, g_step, b_step)] = find_color_index(min(255, r_step), min(255, g_step), min(255, b_step))

def get_color(r, g, b):
    r_snap = min(256, max(0, (int(r) // CACHE_STEP) * CACHE_STEP))
    g_snap = min(256, max(0, (int(g) // CACHE_STEP) * CACHE_STEP))
    b_snap = min(256, max(0, (int(b) // CACHE_STEP) * CACHE_STEP))
    return color_cache.get((r_snap, g_snap, b_snap), 1)

# Center positions
CX = WIDTH / 2.0 + 10
CY = HEIGHT / 2.0 - 10

frames = []

print("Rendering exact 3D smartphone pop-out frames...")

for frame_idx in range(NUM_FRAMES):
    t = frame_idx / float(NUM_FRAMES)
    phase = t * 2.0 * math.pi

    frame_pixels = bytearray([TRANSPARENT_IDX] * (WIDTH * HEIGHT))

    # Floating oscillation (gentle organic floating)
    phone_float = math.sin(phase) * 5.0
    bag_float = math.sin(phase + 0.4) * 7.5
    card_float = math.sin(phase + 0.9) * 9.0

    # -------------------------------------------------------------
    # 1. Soft Floor Shadow & Reflection (like bottom of image)
    # -------------------------------------------------------------
    shadow_cy = CY + 142
    shadow_rx = 95
    shadow_ry = 18
    for dy in range(-int(shadow_ry), int(shadow_ry) + 1):
        for dx in range(-int(shadow_rx), int(shadow_rx) + 1):
            d_sq = (dx*dx)/(shadow_rx*shadow_rx) + (dy*dy)/(shadow_ry*shadow_ry)
            if d_sq < 1.0:
                px = int(CX + dx)
                py = int(shadow_cy + dy)
                if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                    val = int(255 - (1.0 - d_sq) * 38)
                    frame_pixels[py * WIDTH + px] = max(216, min(255, val))

    # -------------------------------------------------------------
    # 2. 3D Smartphone (Upright with glossy purple rim & screen UI)
    # -------------------------------------------------------------
    phone_w = 128
    phone_h = 236
    phone_r = 24
    phone_cx = CX + 14
    phone_cy = CY + phone_float

    p_x0 = phone_cx - phone_w / 2.0
    p_x1 = phone_cx + phone_w / 2.0
    p_y0 = phone_cy - phone_h / 2.0
    p_y1 = phone_cy + phone_h / 2.0

    for y in range(int(p_y0), int(p_y1) + 1):
        for x in range(int(p_x0), int(p_x1) + 1):
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                dx = max(abs(x - phone_cx) - (phone_w/2.0 - phone_r), 0.0)
                dy = max(abs(y - phone_cy) - (phone_h/2.0 - phone_r), 0.0)
                if dx*dx + dy*dy <= phone_r*phone_r:
                    edge_dist = phone_r - math.sqrt(dx*dx + dy*dy)
                    if edge_dist < 4.5:
                        # Deep metallic purple outer bezel (like image)
                        sheen = 0.6 if x < phone_cx else 0.3
                        r = int(85 + 70 * sheen)
                        g = int(25 + 50 * sheen)
                        b = int(140 + 60 * sheen)
                        frame_pixels[y * WIDTH + x] = get_color(r, g, b)
                    elif edge_dist < 6.0:
                        # Black inner glass frame
                        frame_pixels[y * WIDTH + x] = 220
                    else:
                        # Screen Surface (Clean white/lavender studio UI like image)
                        rel_x = x - p_x0
                        rel_y = y - p_y0

                        # Status bar (top)
                        if rel_y < 26:
                            frame_pixels[y * WIDTH + x] = 198
                        # Bottom nav bar
                        elif rel_y > phone_h - 28:
                            frame_pixels[y * WIDTH + x] = 198
                        else:
                            # 2x2 UI Product Tiles (Watch, Box, Camera, Accessories)
                            # Top-left tile: Watch
                            if 32 <= rel_y <= 88 and 10 <= rel_x <= 58:
                                # Rounded tile
                                t_dx = max(abs(rel_x - 34) - 16, 0)
                                t_dy = max(abs(rel_y - 60) - 20, 0)
                                if t_dx*t_dx + t_dy*t_dy <= 64:
                                    # Inside watch tile
                                    # Draw green watch circle
                                    w_dist = math.sqrt((rel_x - 34)**2 + (rel_y - 60)**2)
                                    if w_dist < 11:
                                        frame_pixels[y * WIDTH + x] = 18 # Green watch face
                                    else:
                                        frame_pixels[y * WIDTH + x] = 188 # Pastel lavender tile
                                else:
                                    frame_pixels[y * WIDTH + x] = 205
                            # Top-right tile: Purple Gift Package
                            elif 32 <= rel_y <= 88 and 68 <= rel_x <= 116:
                                t_dx = max(abs(rel_x - 92) - 16, 0)
                                t_dy = max(abs(rel_y - 60) - 20, 0)
                                if t_dx*t_dx + t_dy*t_dy <= 64:
                                    if abs(rel_x - 92) < 10 and abs(rel_y - 60) < 10:
                                        frame_pixels[y * WIDTH + x] = 55 # Purple gift box
                                    else:
                                        frame_pixels[y * WIDTH + x] = 188
                                else:
                                    frame_pixels[y * WIDTH + x] = 205
                            # Bottom-left tile: Gadget
                            elif 98 <= rel_y <= 154 and 10 <= rel_x <= 58:
                                frame_pixels[y * WIDTH + x] = 192
                            # Bottom-right tile: Smart device
                            elif 98 <= rel_y <= 154 and 68 <= rel_x <= 116:
                                frame_pixels[y * WIDTH + x] = 192
                            else:
                                # Clean white screen background
                                frame_pixels[y * WIDTH + x] = 210

    # Top Notch / Speaker
    notch_cx = phone_cx
    notch_cy = p_y0 + 10
    for ny in range(int(notch_cy - 2), int(notch_cy + 3)):
        for nx in range(int(notch_cx - 15), int(notch_cx + 16)):
            if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                frame_pixels[ny * WIDTH + nx] = 220

    # -------------------------------------------------------------
    # 3. Two Large Purple Shopping Bags (Popping OUT in Front of Screen)
    # -------------------------------------------------------------
    # Bag 1: Front primary purple shopping bag
    bag1_w = 68
    bag1_h = 82
    bag1_cx = CX + 20
    bag1_cy = CY + 18 + bag_float

    # 3D Bag with isometric side crease
    for by in range(int(bag1_cy - bag1_h/2.0), int(bag1_cy + bag1_h/2.0) + 1):
        rel_y = (by - (bag1_cy - bag1_h/2.0)) / bag1_h
        cur_w = (bag1_w - 8) + 10 * rel_y
        for bx in range(int(bag1_cx - cur_w/2.0), int(bag1_cx + cur_w/2.0) + 1):
            if 0 <= bx < WIDTH and 0 <= by < HEIGHT:
                # Crease line at 28% from left
                crease_x = bag1_cx - cur_w * 0.22
                if bx < crease_x:
                    # Shaded isometric side face (deep royal purple)
                    r, g, b = 80, 22, 135
                    frame_pixels[by * WIDTH + bx] = get_color(r, g, b)
                else:
                    # Front glossy face (vibrant purple with specular studio sweep)
                    rel_bx = (bx - crease_x) / (cur_w * 0.78)
                    sheen = math.exp(-((rel_bx - 0.5)**2) / 0.12)
                    r = int(140 + 85 * sheen)
                    g = int(45 + 75 * sheen)
                    b = int(220 + 35 * sheen)
                    frame_pixels[by * WIDTH + bx] = get_color(r, g, b)

    # Bag 1 Black Arched Handles (curving from top)
    handle1_y = bag1_cy - bag1_h/2.0
    for angle in range(0, 180, 3):
        rad = math.radians(angle)
        hx = bag1_cx + 2 + math.cos(rad) * 16.0
        hy = handle1_y - math.sin(rad) * 26.0
        for off in range(-1, 2):
            px = int(hx + off)
            py = int(hy)
            if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                frame_pixels[py * WIDTH + px] = 222  # Black handle

    # Bag 2: Secondary purple bag slightly behind bag 1
    bag2_w = 58
    bag2_h = 74
    bag2_cx = CX - 8
    bag2_cy = CY + 10 + bag_float * 0.95
    for by in range(int(bag2_cy - bag2_h/2.0), int(bag2_cy + bag2_h/2.0) + 1):
        rel_y = (by - (bag2_cy - bag2_h/2.0)) / bag2_h
        cur_w = (bag2_w - 6) + 8 * rel_y
        for bx in range(int(bag2_cx - cur_w/2.0), int(bag2_cx + cur_w/2.0) + 1):
            if 0 <= bx < WIDTH and 0 <= by < HEIGHT:
                # Don't draw over bag 1 if bag 1 already painted
                if frame_pixels[by * WIDTH + bx] == TRANSPARENT_IDX or frame_pixels[by * WIDTH + bx] > 180:
                    crease_x = bag2_cx - cur_w * 0.2
                    if bx < crease_x:
                        frame_pixels[by * WIDTH + bx] = 32
                    else:
                        frame_pixels[by * WIDTH + bx] = 48

    # Bag 2 Handle
    for angle in range(0, 180, 4):
        rad = math.radians(angle)
        hx = bag2_cx + math.cos(rad) * 14.0
        hy = (bag2_cy - bag2_h/2.0) - math.sin(rad) * 24.0
        px = int(hx)
        py = int(hy)
        if 0 <= px < WIDTH and 0 <= py < HEIGHT:
            if frame_pixels[py * WIDTH + px] == TRANSPARENT_IDX or frame_pixels[py * WIDTH + px] > 180:
                frame_pixels[py * WIDTH + px] = 222

    # -------------------------------------------------------------
    # 4. Golden / Bronze Shopping Bag (Right side, like image)
    # -------------------------------------------------------------
    gbag_w = 48
    gbag_h = 58
    gbag_cx = CX + 72
    gbag_cy = CY + 38 + bag_float * 0.85

    for by in range(int(gbag_cy - gbag_h/2.0), int(gbag_cy + gbag_h/2.0) + 1):
        rel_y = (by - (gbag_cy - gbag_h/2.0)) / gbag_h
        cur_w = (gbag_w - 4) + 6 * rel_y
        for bx in range(int(gbag_cx - cur_w/2.0), int(gbag_cx + cur_w/2.0) + 1):
            if 0 <= bx < WIDTH and 0 <= by < HEIGHT:
                crease_x = gbag_cx - cur_w * 0.22
                if bx < crease_x:
                    # Shaded bronze side
                    r, g, b = 160, 95, 20
                    frame_pixels[by * WIDTH + bx] = get_color(r, g, b)
                else:
                    # Warm glossy gold front
                    sheen = math.exp(-((bx - (gbag_cx + 8))**2) / 80.0)
                    r = int(225 + 30 * sheen)
                    g = int(155 + 75 * sheen)
                    b = int(35 + 85 * sheen)
                    frame_pixels[by * WIDTH + bx] = get_color(r, g, b)

    # Golden Bag Handle
    for angle in range(0, 180, 5):
        rad = math.radians(angle)
        hx = gbag_cx + math.cos(rad) * 10.0
        hy = (gbag_cy - gbag_h/2.0) - math.sin(rad) * 18.0
        px = int(hx)
        py = int(hy)
        if 0 <= px < WIDTH and 0 <= py < HEIGHT:
            frame_pixels[py * WIDTH + px] = 222

    # -------------------------------------------------------------
    # 5. Glossy Purple Credit / Reward Card (Tilted 3D to the left)
    # -------------------------------------------------------------
    card_w = 64
    card_h = 86
    card_cx = CX - 68
    card_cy = CY + 14 + card_float
    card_angle = math.radians(-22)  # -22 degrees tilt like image
    cos_c = math.cos(card_angle)
    sin_c = math.sin(card_angle)

    for ly in range(int(-card_h/2.0), int(card_h/2.0) + 1):
        for lx in range(int(-card_w/2.0), int(card_w/2.0) + 1):
            cdx = max(abs(lx) - (card_w/2.0 - 7), 0.0)
            cdy = max(abs(ly) - (card_h/2.0 - 7), 0.0)
            if cdx*cdx + cdy*cdy <= 49.0:
                rx = lx * cos_c - ly * sin_c
                ry = lx * sin_c + ly * cos_c
                px = int(card_cx + rx)
                py = int(card_cy + ry)

                if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                    # Three white stripes on card top-left (like image)
                    if -20 <= lx <= -16 and -30 <= ly <= -20:
                        frame_pixels[py * WIDTH + px] = 210
                    elif -13 <= lx <= -9 and -30 <= ly <= -20:
                        frame_pixels[py * WIDTH + px] = 210
                    elif -6 <= lx <= -2 and -30 <= ly <= -20:
                        frame_pixels[py * WIDTH + px] = 210
                    # Card text simulation ("Fatze" / "₹100")
                    elif -18 <= lx <= 12 and -14 <= ly <= -10:
                        frame_pixels[py * WIDTH + px] = 200
                    elif -18 <= lx <= 18 and 14 <= ly <= 22:
                        frame_pixels[py * WIDTH + px] = 205
                    else:
                        # Smooth glossy purple enamel finish
                        sheen = (lx / (card_w/2.0) + 1.0) / 2.0
                        r = int(135 + 85 * sheen)
                        g = int(55 + 80 * sheen)
                        b = int(220 + 35 * sheen)
                        frame_pixels[py * WIDTH + px] = get_color(r, g, b)

    # -------------------------------------------------------------
    # 6. Wireless Over-Ear Headphones (wrapped over the card like image)
    # -------------------------------------------------------------
    # Headband arc looping over the top of the card
    headband_cx = card_cx + 10
    headband_cy = card_cy - 12
    for angle in range(-40, 160, 2):
        rad = math.radians(angle)
        hx = headband_cx + math.cos(rad) * 36.0
        hy = headband_cy - math.sin(rad) * 36.0
        for r_thick in range(-3, 4):
            px = int(hx + math.cos(rad) * r_thick)
            py = int(hy - math.sin(rad) * r_thick)
            if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                frame_pixels[py * WIDTH + px] = 168 # Silver headband

    # Purple Earcup on the right side of the card
    earcup_cx = headband_cx + 28
    earcup_cy = headband_cy + 18
    for edy in range(-14, 15):
        for edx in range(-12, 13):
            if (edx*edx)/144.0 + (edy*edy)/196.0 <= 1.0:
                px = int(earcup_cx + edx)
                py = int(earcup_cy + edy)
                if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                    # Purple earcup with silver cushion
                    if edx < -4:
                        frame_pixels[py * WIDTH + px] = 165 # Silver cushion
                    else:
                        frame_pixels[py * WIDTH + px] = 62  # Glossy purple earcup

    frames.append(bytes(frame_pixels))
    print(f"Rendered exact popout frame {frame_idx + 1}/{NUM_FRAMES}")

# LZW and GIF Writer
def lzw_compress(data, min_code_size):
    clear_code = 1 << min_code_size
    eoi_code = clear_code + 1
    code_size = min_code_size + 1
    dictionary = {bytes([i]): i for i in range(clear_code)}
    next_code = eoi_code + 1
    bits = []
    bit_count = 0
    cur_val = 0

    def emit_code(c):
        nonlocal cur_val, bit_count, bits
        cur_val |= (c << bit_count)
        bit_count += code_size
        while bit_count >= 8:
            bits.append(cur_val & 0xFF)
            cur_val >>= 8
            bit_count -= 8

    emit_code(clear_code)
    current = bytes([data[0]]) if data else b''
    for byte in data[1:]:
        char = bytes([byte])
        combined = current + char
        if combined in dictionary:
            current = combined
        else:
            emit_code(dictionary[current])
            if next_code < 4096:
                dictionary[combined] = next_code
                next_code += 1
                if next_code > (1 << code_size) and code_size < 12:
                    code_size += 1
            else:
                emit_code(clear_code)
                dictionary = {bytes([i]): i for i in range(clear_code)}
                next_code = eoi_code + 1
                code_size = min_code_size + 1
            current = char

    if current:
        emit_code(dictionary[current])
    emit_code(eoi_code)
    if bit_count > 0:
        bits.append(cur_val & 0xFF)

    result = bytearray()
    idx = 0
    while idx < len(bits):
        chunk = bits[idx:idx+255]
        result.append(len(chunk))
        result.extend(chunk)
        idx += len(chunk)
    result.append(0)
    return bytes(result)

def make_transparent_gif(filename, width, height, palette, frames, delay_cs):
    color_table = bytearray()
    for r, g, b in palette:
        color_table.extend([r, g, b])
    while len(color_table) < 768:
        color_table.extend([0, 0, 0])

    min_code_size = 8
    out = bytearray()
    out.extend(b'GIF89a')
    out.extend(struct.pack('<HHBBB', width, height, 0xF7, 0, 0))
    out.extend(color_table)
    out.extend(b'\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00')

    print("Encoding exact pop-out GIF...")
    for idx, frame_data in enumerate(frames):
        out.extend(struct.pack('<BBBBHB', 0x21, 0xF9, 0x04, 0x09, delay_cs, TRANSPARENT_IDX))
        out.extend(struct.pack('<BHHHHB', 0x2C, 0, 0, width, height, 0))
        out.append(min_code_size)
        compressed = lzw_compress(frame_data, min_code_size)
        out.extend(compressed)

    out.append(0x3B)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(out)
    print(f"Exact 3D Popout GIF successfully created: {filename} ({len(out) / 1024:.1f} KB)")

output_path = "assets/images/referral-3d-ecommerce.gif"
make_transparent_gif(output_path, WIDTH, HEIGHT, palette, frames, DELAY_CS)
