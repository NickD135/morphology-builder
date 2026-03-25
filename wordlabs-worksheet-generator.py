"""
Word Labs — Universal Morphology Worksheet Template
Produces a 3-page A4 printable PDF with NO pre-filled content.
Students fill in everything themselves using the slides and Morpheme Builder.

  Page 1 — Dictation A  (2 focus word slots)
  Page 2 — Dictation B  (3 focus word slots)
  Page 3 — Word Matrix  (blank — students find words using Morpheme Builder)

Run once, upload to Supabase Storage, done.
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors

W, H = A4   # 595 x 842 pts
MARGIN = 16 * mm

# ── COLOURS ───────────────────────────────────────────────────
INDIGO      = colors.HexColor("#4338ca")
INDIGO_DARK = colors.HexColor("#312e81")
INDIGO_SOFT = colors.HexColor("#eef2ff")
INDIGO_MID  = colors.HexColor("#6366f1")
TEAL        = colors.HexColor("#0d9488")
TEAL_LIGHT  = colors.HexColor("#ccfbf1")
PURPLE      = colors.HexColor("#7c3aed")
PURPLE_LIGHT= colors.HexColor("#ddd6fe")
PINK        = colors.HexColor("#db2777")
PINK_LIGHT  = colors.HexColor("#fce7f3")
AMBER_LIGHT = colors.HexColor("#fef3c7")
AMBER       = colors.HexColor("#d97706")
SLATE       = colors.HexColor("#475569")
SLATE_LIGHT = colors.HexColor("#e2e8f0")
SLATE_MID   = colors.HexColor("#94a3b8")
WHITE       = colors.white
BLACK       = colors.HexColor("#0f172a")
OFF_WHITE   = colors.HexColor("#f8fafc")
ALT_ROW     = colors.HexColor("#f1f5f9")

# ── HELPERS ───────────────────────────────────────────────────
def rr(c, x, y_top, w, h, r=2*mm, fc=None, sc=None, lw=0.7):
    """Rounded rect — y_top is the TOP edge, draws downward."""
    if fc: c.setFillColor(fc)
    if sc:
        c.setStrokeColor(sc)
        c.setLineWidth(lw)
    c.roundRect(x, y_top - h, w, h, r,
                fill=1 if fc else 0, stroke=1 if sc else 0)

def draw_header(c, day_label, title):
    bh = 11 * mm
    c.setFillColor(INDIGO)
    c.rect(0, H - bh, W, bh, fill=1, stroke=0)
    # Day pill
    pw = 22 * mm
    c.setFillColor(TEAL)
    c.roundRect(MARGIN, H - bh + 2*mm, pw, 7*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(MARGIN + pw/2, H - bh + 4.2*mm, day_label)
    # Title
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + pw + 4*mm, H - bh + 4*mm, title)
    # Word Labs badge
    bw = 28 * mm; bx = W - MARGIN - bw
    c.setFillColor(INDIGO_DARK)
    c.roundRect(bx, H - bh + 2*mm, bw, 7*mm, 2*mm, fill=1, stroke=0)
    c.setFillColor(INDIGO_MID); c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(bx + bw/2, H - bh + 4.2*mm, "wordlabs.app")

def draw_footer(c, pg, total):
    c.setStrokeColor(SLATE_LIGHT); c.setLineWidth(0.5)
    c.line(MARGIN, 10*mm, W - MARGIN, 10*mm)
    c.setFillColor(SLATE_MID); c.setFont("Helvetica", 7)
    c.drawString(MARGIN, 7*mm, "Word Labs Morphology Worksheet  •  wordlabs.app")
    c.drawRightString(W - MARGIN, 7*mm, f"Page {pg} of {total}")

def draw_name_date(c, y_top):
    """Returns y below the row."""
    y = y_top - 5*mm
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN, y, "Name:")
    c.setStrokeColor(SLATE); c.setLineWidth(0.6)
    c.line(MARGIN + 14*mm, y - 0.8*mm, MARGIN + 72*mm, y - 0.8*mm)
    c.drawString(MARGIN + 76*mm, y, "Date:")
    c.line(MARGIN + 90*mm, y - 0.8*mm, MARGIN + 140*mm, y - 0.8*mm)
    c.drawString(MARGIN + 144*mm, y, "Class:")
    c.line(MARGIN + 160*mm, y - 0.8*mm, W - MARGIN, y - 0.8*mm)
    return y_top - 12*mm

def draw_ruled_lines(c, x, y_top, w, n, lh):
    """Draw n ruled writing lines, lh apart."""
    c.setStrokeColor(SLATE_LIGHT); c.setLineWidth(0.6)
    for i in range(n):
        c.line(x, y_top - (i + 1) * lh, x + w, y_top - (i + 1) * lh)

def draw_blank_word_block(c, x, y_top, col_w, n_morpheme_slots, compact=False):
    """
    Draw one fully-blank word breakdown block.
    Sections: Focus Word (write-in), Morphemes (blank boxes), Syllables (blank), Phonemes (blank).
    Returns y below the block.
    """
    label_w  = 26 * mm
    content_w = col_w - label_w - 2*mm
    y = y_top

    # ── Focus word header — blank write-in ──
    hdr_h = 11 * mm if not compact else 9 * mm
    rr(c, x, y, col_w, hdr_h, fc=INDIGO_SOFT, sc=INDIGO_MID, lw=0.8)
    # "Focus word:" label + write line
    c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x + 3*mm, y - hdr_h + 4.5*mm, "Focus word:")
    c.setStrokeColor(INDIGO_MID); c.setLineWidth(0.6)
    c.line(x + 28*mm, y - hdr_h + 3.5*mm, x + col_w - 3*mm, y - hdr_h + 3.5*mm)
    y -= hdr_h + 2*mm

    # ── Morphemes row — n blank chips ──
    chip_h    = 11 * mm if not compact else 9 * mm
    meaning_h =  5 * mm if not compact else 4 * mm
    row_h     = chip_h + meaning_h + 2*mm

    # Row label
    rr(c, x, y, label_w, row_h, fc=SLATE_LIGHT, r=1.5*mm)
    c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + label_w/2, y - row_h/2 - 2.5*mm, "Morphemes")

    # Single continuous morpheme box — students split it themselves
    rr(c, x + label_w + 2*mm, y - 1.5*mm, content_w, chip_h,
       fc=OFF_WHITE, sc=SLATE_LIGHT, lw=0.5, r=1.5*mm)
    # Single meaning line below the box
    c.setStrokeColor(SLATE_LIGHT); c.setLineWidth(0.4)
    c.line(x + label_w + 4*mm, y - 1.5*mm - chip_h - 3*mm,
           x + label_w + 2*mm + content_w - 2*mm, y - 1.5*mm - chip_h - 3*mm)
    c.setFillColor(SLATE_MID); c.setFont("Helvetica-Oblique", 6.5)
    c.drawString(x + label_w + 4*mm, y - 1.5*mm - chip_h - 2*mm,
                 "meaning of each part:")

    y -= row_h + 2*mm

    # ── Syllables row — blank ──
    write_h = 42 * mm if not compact else 18 * mm

    rr(c, x, y, label_w, write_h, fc=SLATE_LIGHT, r=1.5*mm)
    c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + label_w/2, y - write_h/2 - 2.5*mm, "Syllables")
    rr(c, x + label_w + 2*mm, y, content_w, write_h,
       fc=TEAL_LIGHT, sc=TEAL, lw=0.4, r=1.5*mm)

    y -= write_h + 2*mm

    # ── Phonemes row — blank ──
    rr(c, x, y, label_w, write_h, fc=SLATE_LIGHT, r=1.5*mm)
    c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + label_w/2, y - write_h/2 - 2.5*mm, "Phonemes")
    rr(c, x + label_w + 2*mm, y, content_w, write_h,
       fc=PINK_LIGHT, sc=PINK, lw=0.4, r=1.5*mm)

    y -= write_h + 2*mm

    # ── Word meaning row ──
    meaning_row_h = 18 * mm if not compact else 14 * mm
    rr(c, x, y, label_w, meaning_row_h, fc=SLATE_LIGHT, r=1.5*mm)
    c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + label_w/2, y - meaning_row_h/2 - 2.5*mm, "Meaning")
    rr(c, x + label_w + 2*mm, y, content_w, meaning_row_h,
       fc=OFF_WHITE, sc=SLATE_LIGHT, lw=0.5, r=1.5*mm)
    # Prompt text inside
    c.setFillColor(SLATE_MID); c.setFont("Helvetica-Oblique", 7)
    c.drawString(x + label_w + 5*mm, y - meaning_row_h + 4*mm, "This word means...")

    y -= meaning_row_h + 3*mm

    return y - 2*mm


# ── PAGE 1 & 2: DICTATION ─────────────────────────────────────
def draw_dictation_page(c, day_label, title, n_words, n_punctuation,
                        morpheme_slots_per_word, pg, total):
    """
    day_label        — e.g. "Day 2"
    n_words          — number of focus word blocks to draw (2 or 3)
    n_punctuation    — shown in the amber hint box
    morpheme_slots   — how many blank morpheme chip boxes per word
    """
    c.saveState()
    draw_header(c, day_label, title)
    draw_footer(c, pg, total)

    y = H - 14*mm
    y = draw_name_date(c, y)
    y -= 3*mm

    # ── Hint boxes ──
    hint_h = 11 * mm
    hw = (W - 2*MARGIN - 5*mm) / 2

    rr(c, MARGIN, y, hw, hint_h, fc=INDIGO_SOFT, sc=INDIGO_MID, lw=0.8)
    c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN + 3*mm, y - hint_h + 3*mm, str(n_words))
    c.setFillColor(SLATE); c.setFont("Helvetica", 8.5)
    c.drawString(MARGIN + 14*mm, y - hint_h + 4*mm,
                 f"focus word{'s' if n_words != 1 else ''}")

    rr(c, MARGIN + hw + 5*mm, y, hw, hint_h, fc=AMBER_LIGHT, sc=AMBER, lw=0.8)
    c.setFillColor(AMBER); c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN + hw + 8*mm, y - hint_h + 3*mm, str(n_punctuation))
    c.setFillColor(SLATE); c.setFont("Helvetica", 8.5)
    c.drawString(MARGIN + hw + 20*mm, y - hint_h + 4*mm,
                 f"punctuation mark{'s' if n_punctuation != 1 else ''}")
    y -= hint_h + 4*mm

    # ── Instruction ──
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN, y, "Listen and write the sentence. Circle the focus words.")
    y -= 4*mm

    # ── Writing lines — 3 lines at 14mm each ──
    n_lines = 3
    lh = 14 * mm
    draw_ruled_lines(c, MARGIN, y, W - 2*MARGIN, n_lines, lh)
    y -= n_lines * lh + 8*mm

    # ── Divider ──
    c.setStrokeColor(SLATE_LIGHT); c.setLineWidth(0.5)
    c.line(MARGIN, y, W - MARGIN, y)
    y -= 5*mm

    # ── Rewrite instruction ──
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN, y,
                 "Rewrite each focus word below. Fill in the morpheme breakdown, syllables and phonemes.")
    y -= 7*mm

    # ── Word blocks ──
    content_w = W - 2*MARGIN
    gap = 5 * mm

    if n_words == 2:
        # Side by side
        col_w = (content_w - gap) / 2
        for i in range(2):
            draw_blank_word_block(
                c, MARGIN + i * (col_w + gap), y, col_w,
                morpheme_slots_per_word[i], compact=False
            )

    elif n_words == 3:
        # 2 side by side on top, 1 full width below
        col_w = (content_w - gap) / 2
        row1_y = y
        draw_blank_word_block(c, MARGIN,           row1_y, col_w, morpheme_slots_per_word[0], compact=True)
        end_y = draw_blank_word_block(c, MARGIN + col_w + gap, row1_y, col_w, morpheme_slots_per_word[1], compact=True)
        y = end_y - gap
        draw_blank_word_block(c, MARGIN, y, content_w, morpheme_slots_per_word[2], compact=True)

    c.restoreState()


# ── PAGE 3: WORD MATRIX ───────────────────────────────────────
def draw_matrix_page(c, pg, total):
    c.saveState()
    draw_header(c, "Day 3", "Word Matrix — Build Your Own Words")
    draw_footer(c, pg, total)

    y = H - 14*mm
    y = draw_name_date(c, y)
    y -= 4*mm

    # ── Instruction ──
    ins_h = 9 * mm
    rr(c, MARGIN, y, W - 2*MARGIN, ins_h, fc=INDIGO_SOFT, sc=INDIGO_MID, lw=0.8)
    c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 3*mm, y - ins_h + 3.2*mm,
        "Use the Word Labs Morpheme Builder to find words. Write the prefixes, base, and suffixes "
        "you discover in the matrix below.")
    y -= ins_h + 6*mm

    # ── Matrix: Prefixes | Base | Suffixes ──
    mat_w = W - 2*MARGIN
    col_w = [mat_w * 0.27, mat_w * 0.46, mat_w * 0.27]
    col_x = [MARGIN,
              MARGIN + col_w[0] + 1*mm,
              MARGIN + col_w[0] + col_w[1] + 2*mm]
    hdr_h = 9 * mm
    row_h = 10 * mm
    n_rows = 6

    # Headers
    hdr_fc     = [PURPLE,       TEAL,            PINK]
    hdr_labels = ["Prefixes",   "Base & Meaning", "Suffixes"]
    for ci in range(3):
        rr(c, col_x[ci], y, col_w[ci], hdr_h, fc=hdr_fc[ci], r=1.5*mm)
        c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(col_x[ci] + col_w[ci]/2, y - hdr_h + 3*mm, hdr_labels[ci])
    y -= hdr_h + 1*mm

    # Blank rows
    chip_light = [PURPLE_LIGHT, TEAL_LIGHT, PINK_LIGHT]
    for r in range(n_rows):
        row_bg = OFF_WHITE if r % 2 == 0 else ALT_ROW
        for ci in range(3):
            bg = chip_light[ci] if r == 0 and ci == 1 else row_bg
            rr(c, col_x[ci], y, col_w[ci], row_h, fc=bg, sc=SLATE_LIGHT, lw=0.4, r=0)
            # Subtle hint on first base row
            if r == 0 and ci == 1:
                c.setFillColor(TEAL); c.setFont("Helvetica-Oblique", 7.5)
                c.drawCentredString(col_x[ci] + col_w[ci]/2, y - row_h + 3.5*mm,
                                    "root / base word  =  meaning")
        y -= row_h
    y -= 8*mm

    # ── Words I built ──
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, y, "Words I built:")
    y -= 5*mm

    word_cols = 3
    word_rows = 4
    wc_w = (W - 2*MARGIN - 4*mm) / word_cols
    for r in range(word_rows):
        for col in range(word_cols):
            wx = MARGIN + col * (wc_w + 2*mm)
            c.setStrokeColor(SLATE); c.setLineWidth(0.5)
            c.line(wx, y - r * 9*mm, wx + wc_w - 2*mm, y - r * 9*mm)
    y -= word_rows * 9*mm + 10*mm

    # ── Sentences ──
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, y, "Choose 3 words and write a sentence for each:")
    y -= 7*mm

    for s in range(3):
        c.setFillColor(INDIGO); c.setFont("Helvetica-Bold", 9)
        c.drawString(MARGIN, y - 1*mm, f"{s + 1}.")
        draw_ruled_lines(c, MARGIN + 7*mm, y, W - 2*MARGIN - 7*mm, 2, 11*mm)
        y -= 2 * 11*mm + 8*mm

    c.restoreState()


# ── BUILD ─────────────────────────────────────────────────────
def build():
    out = "/home/claude/struct-deck/wordlabs-morphology-worksheet.pdf"
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle("Word Labs — Morphology Worksheet Template")
    c.setAuthor("Word Labs")
    c.setSubject("Universal morphology worksheet — dictation and word matrix")

    # Page 1 — Dictation A: 2 focus words, 1 punctuation mark
    # morpheme_slots = how many blank chip boxes per word (4 and 2 is representative)
    draw_dictation_page(c,
        day_label="Day 2",
        title="Dictation & Word Breakdown",
        n_words=2,
        n_punctuation=1,
        morpheme_slots_per_word=[4, 2],
        pg=1, total=3
    )
    c.showPage()

    # Page 2 — Dictation B: 3 focus words, 2 punctuation marks
    draw_dictation_page(c,
        day_label="Day 3",
        title="Dictation & Word Breakdown",
        n_words=3,
        n_punctuation=2,
        morpheme_slots_per_word=[3, 4, 3],
        pg=2, total=3
    )
    c.showPage()

    # Page 3 — Word Matrix
    draw_matrix_page(c, pg=3, total=3)
    c.showPage()

    c.save()
    print(f"Saved: {out}")

build()
