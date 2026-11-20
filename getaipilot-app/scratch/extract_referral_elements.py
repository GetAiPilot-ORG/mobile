import math
import struct
import zlib

def read_png(filename):
    with open(filename, 'rb') as f:
        png_data = f.read()

    # Simple PNG decoder
    # Check signature
    if png_data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError("Not a PNG file")

    idx = 8
    idat = bytearray()
    width = 0
    height = 0
    color_type = 0
    bit_depth = 0

    while idx < len(png_data):
        length = struct.unpack('>I', png_data[idx:idx+4])[0]
        chunk_type = png_data[idx+4:idx+8]
        chunk_data = png_data[idx+8:idx+8+length]
        idx += 12 + length

        if chunk_type == b'IHDR':
            width, height, bit_depth, color_type, _, _, _ = struct.unpack('>IIBBBBB', chunk_data)
        elif chunk_type == b'IDAT':
            idat.extend(chunk_data)
        elif chunk_type == b'IEND':
            break

    raw = zlib.decompress(idat)

    # Decode rows
    # color_type 6 = RGBA (4 bytes per pixel), color_type 2 = RGB (3 bytes per pixel)
    bpp = 4 if color_type == 6 else 3
    stride = 1 + width * bpp
    pixels = []

    prev_row = bytearray(width * bpp)
    for y in range(height):
        row_filter = raw[y * stride]
        row_data = bytearray(raw[y * stride + 1 : (y + 1) * stride])

        # De-filter
        for i in range(len(row_data)):
            a = row_data[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            c = prev_row[i - bpp] if i >= bpp else 0

            if row_filter == 0:
                pass
            elif row_filter == 1: # Sub
                row_data[i] = (row_data[i] + a) & 0xFF
            elif row_filter == 2: # Up
                row_data[i] = (row_data[i] + b) & 0xFF
            elif row_filter == 3: # Average
                row_data[i] = (row_data[i] + ((a + b) >> 1)) & 0xFF
            elif row_filter == 4: # Paeth
                p = a + b - c
                pa = abs(p - a)
                pb = abs(p - b)
                pc = abs(p - c)
                if pa <= pb and pa <= pc:
                    pr = a
                elif pb <= pc:
                    pr = b
                else:
                    pr = c
                row_data[i] = (row_data[i] + pr) & 0xFF

        prev_row = row_data
        # Convert to RGBA list
        row_pixels = []
        for x in range(width):
            if bpp == 4:
                r, g, b, alpha = row_data[x*4 : x*4+4]
            else:
                r, g, b = row_data[x*3 : x*3+3]
                alpha = 255
            row_pixels.append((r, g, b, alpha))
        pixels.append(row_pixels)

    return width, height, pixels

def write_png(filename, width, height, pixels):
    # pixels is list of rows, each row is list of (r, g, b, a)
    raw = bytearray()
    for row in pixels:
        raw.append(0) # Filter 0 (None)
        for r, g, b, a in row:
            raw.extend([r, g, b, a])

    compressed = zlib.compress(raw)

    out = bytearray(b'\x89PNG\r\n\x1a\n')

    def add_chunk(chunk_type, data):
        out.extend(struct.pack('>I', len(data)))
        out.extend(chunk_type)
        out.extend(data)
        crc = zlib.crc32(chunk_type + data)
        out.extend(struct.pack('>I', crc & 0xFFFFFFFF))

    # IHDR: width, height, bit_depth=8, color_type=6 (RGBA), comp=0, filter=0, interlace=0
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    add_chunk(b'IHDR', ihdr)
    add_chunk(b'IDAT', compressed)
    add_chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(out)

print("Reading base image...")
w, h, pixels = read_png('assets/images/referral-loading-base.png')
print(f"Decoded {w}x{h} PNG successfully.")

# Background color sampling at corners:
bg_r, bg_g, bg_b, _ = pixels[10][10]
print(f"Sampled background color: RGB({bg_r}, {bg_g}, {bg_b})")

def crop_with_chroma_alpha(x0, y0, x1, y1, color_dist_threshold=22.0):
    crop_w = x1 - x0
    crop_h = y1 - y0
    out_pixels = []
    for y in range(y0, y1):
        row = []
        for x in range(x0, x1):
            if 0 <= y < h and 0 <= x < w:
                r, g, b, a = pixels[y][x]
                dr = r - bg_r
                dg = g - bg_g
                db = b - bg_b
                dist = math.sqrt(dr*dr + dg*dg + db*db)
                if dist < color_dist_threshold:
                    # Fade to transparent
                    alpha_factor = max(0.0, (dist - 8.0) / (color_dist_threshold - 8.0))
                    new_a = int(a * alpha_factor)
                else:
                    new_a = a
                row.append((r, g, b, new_a))
            else:
                row.append((0, 0, 0, 0))
        out_pixels.append(row)
    return crop_w, crop_h, out_pixels

# 1. Center Hero Composition (Gift box + Pedestal + Avatars + Connection Arcs)
# This lets us have the whole 3D artwork with transparent background!
print("Extracting transparent 3D center stage...")
cw, ch, stage_pixels = crop_with_chroma_alpha(50, 180, 526, 610, color_dist_threshold=24.0)
write_png('assets/images/referral-3d-stage-transparent.png', cw, ch, stage_pixels)
print(f"Saved referral-3d-stage-transparent.png ({cw}x{ch})")

# 2. Individual Gift Box + Pedestal
gw, gh, gift_pixels = crop_with_chroma_alpha(180, 340, 396, 595, color_dist_threshold=24.0)
write_png('assets/images/referral-gift-pedestal.png', gw, gh, gift_pixels)
print(f"Saved referral-gift-pedestal.png ({gw}x{gh})")

# 3. Top Avatar (Green shirt boy)
tw, th, top_pixels = crop_with_chroma_alpha(225, 205, 350, 345, color_dist_threshold=24.0)
write_png('assets/images/referral-avatar-top.png', tw, th, top_pixels)
print(f"Saved referral-avatar-top.png ({tw}x{th})")

# 4. Left Avatar (Purple top girl)
lw, lh, left_pixels = crop_with_chroma_alpha(65, 355, 195, 495, color_dist_threshold=24.0)
write_png('assets/images/referral-avatar-left.png', lw, lh, left_pixels)
print(f"Saved referral-avatar-left.png ({lw}x{lh})")

# 5. Right Avatar (Pink hoodie boy)
rw, rh, right_pixels = crop_with_chroma_alpha(380, 365, 510, 505, color_dist_threshold=24.0)
write_png('assets/images/referral-avatar-right.png', rw, rh, right_pixels)
print(f"Saved referral-avatar-right.png ({rw}x{rh})")

print("All elements extracted with transparent backgrounds!")
