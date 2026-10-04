from pathlib import Path

import pdfplumber


SOURCE = Path("source-material/SQM39462-LynkCO")
OUTPUT = SOURCE / "extracted-text"
OUTPUT.mkdir(parents=True, exist_ok=True)

for pdf_path in sorted(SOURCE.rglob("*.pdf")):
    relative = pdf_path.relative_to(SOURCE)
    output_path = OUTPUT / relative.with_suffix(".txt")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for index, page in enumerate(pdf.pages, 1):
            text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
            pages.append(f"\n--- STRONA {index} ---\n{text}\n")
    output_path.write_text("".join(pages), encoding="utf-8")
    print(f"{relative}: {len(pages)} stron -> {output_path}")
