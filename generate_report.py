#!/usr/bin/env python3
"""Generate AC Installation Findings Report PDF in Hebrew (RTL)."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from bidi.algorithm import get_display

# Register fonts
pdfmetrics.registerFont(TTFont('Hebrew', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('HebrewBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

WIDTH, HEIGHT = A4  # 595.27 x 841.89 points

# Colors
PRIMARY = HexColor('#1a365d')      # Dark blue
SECONDARY = HexColor('#2b6cb0')    # Medium blue
ACCENT = HexColor('#e53e3e')       # Red for warnings
LIGHT_BG = HexColor('#f7fafc')     # Light background
BORDER = HexColor('#cbd5e0')       # Border gray
DARK_TEXT = HexColor('#1a202c')    # Near black


def heb(text):
    """Convert Hebrew text for RTL display."""
    return get_display(text)


def draw_right_aligned(c, text, x_right, y, font='Hebrew', size=11, color=DARK_TEXT):
    """Draw right-aligned Hebrew text."""
    c.setFont(font, size)
    c.setFillColor(color)
    display_text = heb(text)
    text_width = c.stringWidth(display_text, font, size)
    c.drawString(x_right - text_width, y, display_text)


def draw_rtl_paragraph(c, text, x_right, y, max_width, font='Hebrew', size=11, color=DARK_TEXT, leading=18):
    """Draw a right-aligned paragraph with word wrapping for Hebrew text."""
    c.setFont(font, size)
    c.setFillColor(color)

    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = ' '.join(current_line + [word])
        test_display = heb(test_line)
        w = c.stringWidth(test_display, font, size)
        if w > max_width and current_line:
            lines.append(' '.join(current_line))
            current_line = [word]
        else:
            current_line.append(word)
    if current_line:
        lines.append(' '.join(current_line))

    for line in lines:
        display_line = heb(line)
        text_width = c.stringWidth(display_line, font, size)
        c.drawString(x_right - text_width, y, display_line)
        y -= leading

    return y


def draw_header(c, y):
    """Draw the document header with blue banner."""
    # Top banner
    c.setFillColor(PRIMARY)
    c.rect(0, HEIGHT - 80, WIDTH, 80, fill=True, stroke=False)

    # Title
    c.setFillColor(white)
    c.setFont('HebrewBold', 22)
    title = heb('דוח ממצאים - התקנת מערכת מיזוג אוויר')
    tw = c.stringWidth(title, 'HebrewBold', 22)
    c.drawString((WIDTH - tw) / 2, HEIGHT - 40, title)

    # Subtitle
    c.setFont('Hebrew', 12)
    subtitle = heb('בדיקת עמידה בתקן ישראלי ת"י 994 חלק 4')
    sw = c.stringWidth(subtitle, 'Hebrew', 12)
    c.drawString((WIDTH - sw) / 2, HEIGHT - 60, subtitle)

    # Accent line
    c.setFillColor(ACCENT)
    c.rect(WIDTH/2 - 60, HEIGHT - 68, 120, 3, fill=True, stroke=False)

    return HEIGHT - 100


def draw_info_box(c, y):
    """Draw document info box."""
    box_x = 30
    box_width = WIDTH - 60
    box_height = 75
    y_box = y - box_height

    # Box background
    c.setFillColor(LIGHT_BG)
    c.setStrokeColor(BORDER)
    c.setLineWidth(1)
    c.roundRect(box_x, y_box, box_width, box_height, 5, fill=True, stroke=True)

    right_margin = WIDTH - 45

    # Date
    draw_right_aligned(c, 'תאריך: 20 במרץ 2026', right_margin, y_box + 52, 'HebrewBold', 11, PRIMARY)

    # Subject line
    draw_right_aligned(c, 'הנדון: התקנת יחידה חיצונית של מזגן בניגוד לתקן ויצירת מפגע בטיחותי', right_margin, y_box + 32, 'HebrewBold', 11, ACCENT)

    # Reference
    draw_right_aligned(c, 'תקן ייחוס: ת"י 994 חלק 4 - התקנת מערכות מיזוג אוויר', right_margin, y_box + 12, 'Hebrew', 10, DARK_TEXT)

    return y_box - 15


def draw_section_title(c, title, y):
    """Draw a section title with accent bar."""
    right_margin = WIDTH - 40

    # Blue accent bar on the right
    c.setFillColor(SECONDARY)
    c.rect(right_margin + 2, y - 2, 5, 18, fill=True, stroke=False)

    draw_right_aligned(c, title, right_margin, y, 'HebrewBold', 14, PRIMARY)

    # Underline
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(40, y - 5, right_margin, y - 5)

    return y - 25


def draw_finding_box(c, number, title, description, y):
    """Draw a finding item with number badge."""
    right_margin = WIDTH - 40
    left_margin = 40
    content_width = right_margin - left_margin - 10

    # Number badge
    badge_x = right_margin - 5
    badge_y = y + 3
    c.setFillColor(ACCENT)
    c.circle(badge_x, badge_y, 10, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont('HebrewBold', 10)
    c.drawCentredString(badge_x, badge_y - 3.5, str(number))

    # Finding title
    draw_right_aligned(c, title, right_margin - 22, y, 'HebrewBold', 12, DARK_TEXT)
    y -= 18

    # Finding description
    y = draw_rtl_paragraph(c, description, right_margin - 10, y, content_width, 'Hebrew', 10.5, DARK_TEXT, 16)

    return y - 8


def draw_images_page(c, image_paths, page_title):
    """Draw a page with images."""
    c.showPage()

    # Header bar
    c.setFillColor(PRIMARY)
    c.rect(0, HEIGHT - 50, WIDTH, 50, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont('HebrewBold', 16)
    t = heb(page_title)
    tw = c.stringWidth(t, 'HebrewBold', 16)
    c.drawString((WIDTH - tw) / 2, HEIGHT - 33, t)

    y = HEIGHT - 70
    margin = 40
    available_width = WIDTH - 2 * margin

    for i, img_path in enumerate(image_paths):
        if not os.path.exists(img_path):
            continue

        try:
            img = ImageReader(img_path)
            iw, ih = img.getSize()

            # Calculate scaling
            max_img_height = 320
            max_img_width = available_width

            scale = min(max_img_width / iw, max_img_height / ih)
            draw_w = iw * scale
            draw_h = ih * scale

            if y - draw_h - 40 < 50:
                c.showPage()
                # Header bar on new page
                c.setFillColor(PRIMARY)
                c.rect(0, HEIGHT - 50, WIDTH, 50, fill=True, stroke=False)
                c.setFillColor(white)
                c.setFont('HebrewBold', 16)
                c.drawString((WIDTH - tw) / 2, HEIGHT - 33, t)
                y = HEIGHT - 70

            # Image border/shadow
            img_x = margin + (available_width - draw_w) / 2
            img_y = y - draw_h - 5

            c.setStrokeColor(BORDER)
            c.setLineWidth(1)
            c.setFillColor(white)
            c.roundRect(img_x - 5, img_y - 5, draw_w + 10, draw_h + 10, 3, fill=True, stroke=True)

            c.drawImage(img, img_x, img_y, draw_w, draw_h, preserveAspectRatio=True)

            # Caption
            c.setFont('Hebrew', 9)
            c.setFillColor(DARK_TEXT)
            caption = heb(f'תמונה {i + 1}')
            cw = c.stringWidth(caption, 'Hebrew', 9)
            c.drawString(margin + (available_width - cw) / 2, img_y - 18, caption)

            y = img_y - 35

        except Exception as e:
            print(f"Warning: Could not load image {img_path}: {e}")
            continue


def draw_conclusion_section(c, y):
    """Draw conclusion section."""
    right_margin = WIDTH - 40
    left_margin = 40
    content_width = right_margin - left_margin - 10

    # Warning box
    box_height = 85
    if y - box_height < 80:
        c.showPage()
        y = HEIGHT - 50

    box_y = y - box_height

    # Red border warning box
    c.setFillColor(HexColor('#fff5f5'))
    c.setStrokeColor(ACCENT)
    c.setLineWidth(2)
    c.roundRect(left_margin, box_y, content_width + 10, box_height, 5, fill=True, stroke=True)

    # Warning title
    c.setFillColor(ACCENT)
    c.setFont('HebrewBold', 13)
    warning_title = heb('סיכום והמלצות')
    ww = c.stringWidth(warning_title, 'HebrewBold', 13)
    c.drawString(right_margin - ww - 5, box_y + box_height - 22, warning_title)

    conclusion_text = 'לאור הממצאים המפורטים לעיל, ההתקנה אינה עומדת בדרישות תקן ישראלי ת"י 994 חלק 4 ומהווה מפגע בטיחותי. יש לבצע תיקון מיידי הכולל קיבוע היחידה למשטח הבטון באמצעות ברגי עיגון תקניים.'

    draw_rtl_paragraph(c, conclusion_text, right_margin - 5, box_y + box_height - 40, content_width - 5, 'Hebrew', 10.5, DARK_TEXT, 16)

    return box_y - 20


def draw_footer(c, page_num):
    """Draw page footer."""
    c.setFillColor(PRIMARY)
    c.rect(0, 0, WIDTH, 25, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont('Hebrew', 8)

    footer_text = heb(f'דוח ממצאים - התקנת מזגן | עמוד {page_num}')
    fw = c.stringWidth(footer_text, 'Hebrew', 8)
    c.drawString((WIDTH - fw) / 2, 9, footer_text)


def generate_report():
    """Generate the full PDF report."""
    output_path = '/home/user/atlas/ac_installation_report.pdf'

    # Image paths - check what's available
    script_dir = '/home/user/atlas'
    image_files = []
    for f in sorted(os.listdir(script_dir)):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            image_files.append(os.path.join(script_dir, f))

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle('AC Installation Findings Report')
    c.setAuthor('Technical Inspection Report')

    # === PAGE 1 ===
    y = draw_header(c, HEIGHT)
    y = draw_info_box(c, y)

    # Introduction section
    y = draw_section_title(c, 'תיאור המצב', y)

    intro_text = 'ברצוני להביא לידיעתך כי בגינה הסמוכה לדירה הותקנה יחידה חיצונית של מזגן (מעבה) באופן שאינו עומד בדרישות תקן ישראלי ת"י 994 חלק 4 העוסק בהתקנת מערכות מיזוג אוויר.'

    right_margin = WIDTH - 50
    y = draw_rtl_paragraph(c, intro_text, right_margin, y, WIDTH - 100, 'Hebrew', 11, DARK_TEXT, 17)
    y -= 10

    # Findings section
    y = draw_section_title(c, 'ממצאים עיקריים', y)

    y = draw_finding_box(c, 1,
        'היחידה אינה מקובעת למשטח הבטון',
        'היחידה החיצונית מונחת על גבי משטח המכוסה בדשא סינטטי, כאשר מתחתיו קיים משטח בטון, אולם היחידה אינה מקובעת למשטח הבטון באמצעות ברגי עיגון או אמצעי קיבוע תקניים, אלא מונחת על גבי תושבות גומי בלבד.',
        y)

    y = draw_finding_box(c, 2,
        'נקודות עיגון קיימות אך אינן בשימוש',
        'בתושבות הגומי קיימות נקודות עיגון וכן בתושבות היחידה קיימים פתחים המיועדים לקיבוע, אך בפועל היחידה אינה מחוברת למשטח. מצב זה מאפשר תזוזה של היחידה בזמן פעולה או לאורך זמן.',
        y)

    y = draw_finding_box(c, 3,
        'אי עמידה בדרישות התקן',
        'לפי דרישות תקן ישראלי ת"י 994 חלק 4, יחידה חיצונית חייבת להיות מותקנת על בסיס יציב ולהיות מקובעת אליו באופן שימנע תזוזה, התרופפות או סכנת נפילה במהלך פעולה או לאורך זמן.',
        y)

    y = draw_finding_box(c, 4,
        'מפגע בטיחותי',
        'התקנה שבה היחידה מונחת ללא קיבוע לבסיס קבוע אינה עומדת בדרישות התקן ועלולה להוות מפגע בטיחותי.',
        y)

    # Conclusion
    y = draw_conclusion_section(c, y)

    draw_footer(c, 1)

    # === IMAGES PAGES ===
    if image_files:
        draw_images_page(c, image_files, 'נספח תמונות - תיעוד הליקויים')
        # Add footer to image pages
        page_num = 2
        draw_footer(c, page_num)

    c.save()
    print(f"Report generated: {output_path}")
    return output_path


if __name__ == '__main__':
    generate_report()
