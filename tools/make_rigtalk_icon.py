from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
BG = (10, 10, 11, 255)
RED = (224, 30, 30, 255)
WHITE = (243, 242, 239, 255)
OUT = Path(__file__).resolve().parents[1] / "assets"
FONT_PATH = Path(r"C:\Windows\Fonts\impact.ttf")


def fitted_font(draw, text, target_width):
    size = 420
    while size > 40:
        font = ImageFont.truetype(str(FONT_PATH), size)
        box = draw.textbbox((0, 0), text, font=font)
        if box[2] - box[0] <= target_width:
            return font
        size -= 4
    return ImageFont.truetype(str(FONT_PATH), 40)


def make_icon(size=SIZE):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=BG)

    # Dwie zwarte linie brandu — bez symboli, czytelne na ekranie telefonu.
    rig_font = fitted_font(draw, "RIG", int(size * 0.68))
    talk_font = fitted_font(draw, "TALK", int(size * 0.78))
    draw.text((size // 2, int(size * 0.31)), "RIG", font=rig_font, fill=WHITE, anchor="mm")
    draw.text((size // 2, int(size * 0.70)), "TALK", font=talk_font, fill=RED, anchor="mm")
    return image


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    image = make_icon()
    for size in (1024, 512, 192, 180):
        resized = image if size == SIZE else image.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(OUT / f"rigtalk-icon-{size}.png")
    print("Wygenerowano ikony RIG TALK:", OUT)


if __name__ == "__main__":
    main()
