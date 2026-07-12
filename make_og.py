from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
FONT_DIR = "/c/Windows/Fonts"
def font(name, size): return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

serif      = font("georgia.ttf", 150)
serif_i    = font("georgiaz.ttf", 150)
sans       = font("arialbd.ttf", 34)
sans2      = font("arial.ttf", 26)

W, H = 1200, 630
bg = Image.new("RGB", (W, H), (20, 17, 15))
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse([W//2-540, H//2-380, W//2+540, H//2+380], fill=80)
glow = glow.filter(ImageFilter.GaussianBlur(130))
gold = Image.new("RGB", (W, H), (176, 141, 87))
bg = Image.composite(gold, bg, glow)

# product montage on the right (kept clear of the text column: x >= 720)
def place(imgn, x, y, size):
    im = Image.open(f"assets/img/{imgn}").convert("RGBA").resize((size, size))
    bg.paste(im, (x, y), im)

place("aviator.png", 880, 90, 290)
place("cat-eye.png", 980, 250, 290)
place("crystal.png", 760, 380, 240)

d = ImageDraw.Draw(bg)
d.ellipse([120, 118, 134, 132], fill=(176, 141, 87))
d.text((150, 102), "LUMIÈRE", font=serif, fill=(247, 243, 237))
d.text((120, 200), "See the world", font=serif_i, fill=(247, 243, 237))
d.text((120, 320), "in clarity", font=serif_i, fill=(176, 141, 87))
d.text((122, 462), "Premium handcrafted eyewear", font=sans, fill=(222, 212, 198))
d.text((122, 506), "Precision optics - Florence since 2008", font=sans2, fill=(190, 180, 166))
bg.save("assets/img/og-cover.png")
print("OG image written:", os.path.getsize("assets/img/og-cover.png"), "bytes")
