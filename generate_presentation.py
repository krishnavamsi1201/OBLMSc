import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.dml.color import RGBColor

# Initialize Presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# Color Palette (High Contrast Dark Luxury Theme)
COLOR_BG = RGBColor(10, 17, 40)        # Deep Navy #0A1128
COLOR_CARD_BG = RGBColor(16, 27, 56)   # #101B38
COLOR_INNER_CARD = RGBColor(9, 16, 36) # #091024
COLOR_BORDER = RGBColor(38, 56, 98)    # Lighter border for clarity
COLOR_GOLD = RGBColor(212, 175, 55)    # Gold #D4AF37
COLOR_GOLD_LIGHT = RGBColor(253, 230, 138) # #FDE68A
COLOR_CYAN = RGBColor(56, 189, 248)    # Cyan #38BDF8
COLOR_BLUE = RGBColor(96, 165, 250)    # Blue #60A5FA
COLOR_GREEN = RGBColor(74, 222, 128)   # Emerald #4ADE80
COLOR_TEXT_WHITE = RGBColor(255, 255, 255)
COLOR_TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
COLOR_TEXT_BODY = RGBColor(226, 232, 240)  # Brighter Body Text #E2E8F0

def create_slide_background(slide):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_BG
    bg.line.color.rgb = COLOR_BG

def add_header(slide, slide_num, title, subtitle):
    header_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.4), Inches(12.133), Inches(0.95))
    header_box.fill.solid()
    header_box.fill.fore_color.rgb = COLOR_CARD_BG
    header_box.line.color.rgb = COLOR_BORDER
    header_box.line.width = Pt(1.2)

    tf = header_box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.1)
    tf.margin_right = Inches(0.2)
    tf.margin_bottom = Inches(0.05)

    p1 = tf.paragraphs[0]
    p1.text = f"{slide_num}. {title}"
    p1.font.name = 'Calibri'
    p1.font.size = Pt(22)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.text = subtitle
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_GOLD_LIGHT

def add_footer(slide, current_page, total_pages=20):
    footer_box = slide.shapes.add_textbox(Inches(0.6), Inches(7.08), Inches(12.133), Inches(0.35))
    tf = footer_box.text_frame
    tf.margin_top = 0
    tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = f"SIDDHI v2.0 — Outcome-Based Learning Management System  |  Centurion University  |  Slide {current_page} of {total_pages}"
    p.font.name = 'Calibri'
    p.font.size = Pt(10.5)
    p.font.color.rgb = COLOR_TEXT_MUTED

def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.2)
    return card

# ==============================================================================
# SLIDE 1: TITLE SLIDE (Clean, Bold, Large Fonts)
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
create_slide_background(slide1)

main_title_card = add_card(slide1, 0.8, 0.7, 11.733, 6.1, bg_color=COLOR_CARD_BG, border_color=COLOR_GOLD)

# University & Domain Badge
badge = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(1.0), Inches(6.5), Inches(0.5))
badge.fill.solid()
badge.fill.fore_color.rgb = COLOR_INNER_CARD
badge.line.color.rgb = COLOR_GOLD
badge.line.width = Pt(1.2)
tf = badge.text_frame
p = tf.paragraphs[0]
p.text = "🏛️ SOFTWARE TECHNOLOGY DOMAIN  |  FINAL PROJECT"
p.font.name = 'Calibri'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD

# Title Text (Large & Clear)
title_box = slide1.shapes.add_textbox(Inches(1.2), Inches(1.65), Inches(10.9), Inches(1.8))
tf = title_box.text_frame
tf.word_wrap = True
p1 = tf.paragraphs[0]
p1.text = "Project SIDDHI: Smart Outcome-Based Learning &\nAccreditation Governance System"
p1.font.name = 'Calibri'
p1.font.size = Pt(28)
p1.font.bold = True
p1.font.color.rgb = COLOR_TEXT_WHITE

p2 = tf.add_paragraph()
p2.text = "An Enterprise Platform for Automated CO-PO Attainment, Faculty Workload & Marksheet Governance"
p2.font.name = 'Calibri'
p2.font.size = Pt(15)
p2.font.color.rgb = COLOR_CYAN

# Metadata 2-Column Grid (Large & Readable 13.5pt)
col1_card = add_card(slide1, 1.2, 3.7, 5.2, 2.6, bg_color=COLOR_INNER_CARD, border_color=COLOR_BORDER)
tf = col1_card.text_frame
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.2)
p = tf.paragraphs[0]
p.text = "👥 Project Author & Student"
p.font.name = 'Calibri'
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD_LIGHT

bullets_team = [
    ("Student Name:", "V. Krishna Vamsi"),
    ("Registration No:", "CUTM2026CSE042 (STU004)"),
    ("Program:", "B.Tech Computer Science & Engg."),
    ("Academic Year:", "2026 – 2027 (Final Year B.Tech)")
]
for lbl, val in bullets_team:
    p = tf.add_paragraph()
    p.text = f"• {lbl} {val}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_BODY

col2_card = add_card(slide1, 6.7, 3.7, 5.4, 2.6, bg_color=COLOR_INNER_CARD, border_color=COLOR_BORDER)
tf = col2_card.text_frame
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.2)
p = tf.paragraphs[0]
p.text = "🏛️ Supervision & Institution"
p.font.name = 'Calibri'
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD_LIGHT

bullets_inst = [
    ("Project Guide:", "Project Faculty Guide / Supervisor"),
    ("Department:", "Dept. of Computer Science & Engineering"),
    ("University:", "Centurion University of Technology & Management"),
    ("Accreditation:", "NBA Tier-1 & NAAC 2.6 Framework")
]
for lbl, val in bullets_inst:
    p = tf.add_paragraph()
    p.text = f"• {lbl} {val}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide1, 1)

# ==============================================================================
# SLIDE 2: INTRODUCTION (Concise & Large 14pt)
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
create_slide_background(slide2)
add_header(slide2, 2, "Introduction", "Real-World Context, Stakeholders & High-Level Solution")

intro_cards = [
    ("🌍 Real-World Context", [
        "Outcome-Based Education (OBE) is mandatory for NBA Tier-1 and NAAC accreditations.",
        "Institutions must quantify student learning outcomes and map exams to CO-PO benchmarks.",
        "Manual tracking in spreadsheets creates massive friction and calculation errors."
    ], COLOR_CYAN),
    ("👥 Core Stakeholders", [
        "Chief Administrator / Dean: Sets global grading weights & exports NBA SAR reports.",
        "Teaching Faculty: Manages subject workloads, grades exams & maps questions to COs.",
        "Enrolled Students: Views dynamic SGPA/CGPA marksheets & official PDF transcripts."
    ], COLOR_GOLD),
    ("💻 The Solution: Project SIDDHI", [
        "Enterprise single-page web application built with Angular 18 and Java/Spring Boot.",
        "Automates curriculum allocation, weighted grading, SGPA/CGPA, and SAR reporting.",
        "Features real-time state synchronization across browser tabs with zero lag."
    ], COLOR_GREEN)
]

for idx, (head, points, color) in enumerate(intro_cards):
    card = add_card(slide2, 0.6 + idx*4.1, 1.55, 3.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.22)
    tf.margin_top = Inches(0.22)
    tf.margin_right = Inches(0.22)
    p = tf.paragraphs[0]
    p.text = head
    p.font.name = 'Calibri'
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = color
    
    for pt in points:
        p = tf.add_paragraph()
        p.text = f"• {pt}"
        p.font.name = 'Calibri'
        p.font.size = Pt(13.5)
        p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide2, 2)

# ==============================================================================
# SLIDE 3: PROBLEM STATEMENT (High Impact, Clean)
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
create_slide_background(slide3)
add_header(slide3, 3, "Problem Statement", "Critical Institutional Pain Points & Need for Modern Automation")

left_card = add_card(slide3, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "⚠️ Existing Process Limitations"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = RGBColor(248, 113, 113)

prob_points = [
    "Fragmented Excel Files: Marks stored in separate spreadsheets across teachers cause data loss and inconsistency.",
    "Complex Manual Formulas: Calculating 40% CIE / 60% SEE weighted marks and 12-PO vectors by hand takes hundreds of hours.",
    "No Real-Time Visibility: HODs lack a centralized dashboard to track faculty workloads and unassigned subjects.",
    "Delayed Accreditation Reports: Consolidating student dossiers for NBA/NAAC inspection takes weeks of emergency effort."
]
for pt in prob_points:
    p = tf.add_paragraph()
    p.text = f"• {pt}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide3, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "🎯 The Engineering Objective"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD

p2 = tf.add_paragraph()
p2.text = "\"To replace manual spreadsheets with a unified, reactive web platform that automates multi-department curriculum allocation, calculates live SGPA/CGPA marksheets, and compiles instant NBA SAR dossiers with zero human error.\""
p2.font.name = 'Calibri'
p2.font.size = Pt(15)
p2.font.bold = True
p2.font.color.rgb = COLOR_CYAN

p3 = tf.add_paragraph()
p3.text = "\nTarget Quality Goals:"
p3.font.name = 'Calibri'
p3.font.size = Pt(14)
p3.font.bold = True
p3.font.color.rgb = COLOR_TEXT_WHITE

reqs = [
    "Zero calculation errors across 8 semesters and 6 departments.",
    "Sub-second sync between mark entry and student transcripts.",
    "Instant one-click official PDF and CSV dossier exports."
]
for r in reqs:
    p = tf.add_paragraph()
    p.text = f"✔ {r}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_GREEN

add_footer(slide3, 3)

# ==============================================================================
# SLIDE 4: OBJECTIVES (Clean, Spacious, 14pt)
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
create_slide_background(slide4)
add_header(slide4, 4, "Objectives of the Project", "Specific Functional and Technical Targets")

objectives = [
    ("1. Automated OBE Attainment Engine", "Compute direct/indirect Course Outcome (CO) and 12-Program Outcome (PO) matrices based on custom threshold benchmarks (e.g. 75%).", COLOR_CYAN),
    ("2. Dual-View Faculty Workload Deck", "Provide interactive workload governance (By Faculty Deck & By Branch/Semester Matrix) across 6 branches (CSE, IT, ECE, ME, CE, EEE).", COLOR_GOLD),
    ("3. Student Results & Marksheet System", "Implement Master-Detail expandable student cards with live SGPA/CGPA calculations and single-click official PDF transcript export.", COLOR_GREEN),
    ("4. Instant Accreditation Reporting", "Build an automated NBA SAR Criterion 3 and NAAC 2.6 report generator with real-time filters, search, and CSV/JSON/PDF downloads.", COLOR_BLUE)
]

for idx, (title, desc, color) in enumerate(objectives):
    row_card = add_card(slide4, 0.6, 1.55 + idx*1.32, 12.133, 1.18, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = row_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.16)
    tf.margin_right = Inches(0.25)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13.5)
    p2.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide4, 4)

# ==============================================================================
# SLIDE 5: EXISTING SYSTEM VS PROPOSED (Clean Table, Large 13pt)
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
create_slide_background(slide5)
add_header(slide5, 5, "Existing System vs Proposed System", "Direct Comparison of Operational Capabilities")

table_shape = slide5.shapes.add_table(5, 3, Inches(0.6), Inches(1.6), Inches(12.133), Inches(5.1))
table = table_shape.table
table.columns[0].width = Inches(3.2)
table.columns[1].width = Inches(4.4)
table.columns[2].width = Inches(4.533)

headers = ["Operational Area", "Manual Existing System", "Proposed SIDDHI Platform"]
for i, h in enumerate(headers):
    cell = table.cell(0, i)
    cell.fill.solid()
    cell.fill.fore_color.rgb = COLOR_INNER_CARD
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.name = 'Calibri'
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_GOLD

rows_data = [
    ("Curriculum & Allotment", "Standalone Word/Excel files per branch.", "Centralized Dual-View Faculty Workload Deck."),
    ("OBE Mark Evaluation", "Manual 40/60 weight math on paper.", "Automated CIE/SEE calculation & instant grades."),
    ("Student Results", "Flat noticeboard lists with repeat rows.", "Master-Detail expandable cards with SGPA/CGPA."),
    ("Accreditation Dossiers", "Weeks of manual compilation before visit.", "One-click NBA SAR Criterion 3 & NAAC 2.6 PDF/CSV.")
]

for row_idx, data in enumerate(rows_data, 1):
    for col_idx, text in enumerate(data):
        cell = table.cell(row_idx, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_CARD_BG if row_idx % 2 == 1 else COLOR_INNER_CARD
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.name = 'Calibri'
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_WHITE if col_idx == 0 else (COLOR_GREEN if col_idx == 2 else COLOR_TEXT_BODY)

add_footer(slide5, 5)

# ==============================================================================
# SLIDE 6: PROPOSED WORKFLOW (4 Cards, 13.5pt)
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
create_slide_background(slide6)
add_header(slide6, 6, "Proposed System Architecture & Workflow", "End-to-End Academic Automation Pipeline")

steps = [
    ("Step 1: Curriculum & Policy", [
        "Admin sets academic session (2026-27).",
        "Configures CIE/SEE weights (40/60%).",
        "Establishes CO target threshold (75%)."
    ], COLOR_CYAN),
    ("Step 2: Workload Allotment", [
        "HOD assigns courses to professors.",
        "Covers 6 branches (CSE, IT, ECE, ME, CE, EEE).",
        "Monitors weekly contact hours & credits."
    ], COLOR_BLUE),
    ("Step 3: Continuous Grading", [
        "Faculty records internal CIE & final SEE marks.",
        "Marks map directly to Course Outcomes.",
        "Instant validation prevents out-of-range entry."
    ], COLOR_GOLD),
    ("Step 4: Automated Output", [
        "Engine computes SGPA, CGPA & standings.",
        "Generates expandable student marksheets.",
        "Exports compliant NBA SAR dossiers."
    ], COLOR_GREEN)
]

for idx, (title, points, color) in enumerate(steps):
    card = add_card(slide6, 0.6 + idx*3.1, 1.55, 2.85, 4.0, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.18)
    tf.margin_top = Inches(0.2)
    tf.margin_right = Inches(0.18)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = color
    
    for pt in points:
        p = tf.add_paragraph()
        p.text = f"• {pt}"
        p.font.name = 'Calibri'
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_BODY

bottom_card = add_card(slide6, 0.6, 5.75, 12.133, 1.05, bg_color=COLOR_INNER_CARD, border_color=COLOR_GOLD)
tf = bottom_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.12)
p = tf.paragraphs[0]
p.text = "🌟 Key Architectural Highlights:"
p.font.name = 'Calibri'
p.font.size = Pt(13.5)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD_LIGHT

p2 = tf.add_paragraph()
p2.text = "• Angular 18 Standalone Architecture  • Reactive SyncService Event Bus  • Multi-Tier Role Guards  • One-Click PDF/CSV Engine"
p2.font.name = 'Calibri'
p2.font.size = Pt(13)
p2.font.color.rgb = COLOR_TEXT_WHITE

add_footer(slide6, 6)

# ==============================================================================
# SLIDE 7: SCOPE OF THE PROJECT (Concise, 14pt)
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
create_slide_background(slide7)
add_header(slide7, 7, "Scope of the Project", "Implemented Capabilities vs Future Roadmap")

left_card = add_card(slide7, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "✅ Implemented Features (In Scope)"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_GREEN

in_scope = [
    "Role-Based Governance: Admin, Faculty, and Student portals with Angular Route Guards.",
    "Dual-View Faculty Workload Deck: Workload cards with contact hours, credits, and branch matrix.",
    "Expandable Results Deck: Student cards with SGPA/CGPA and one-click PDF transcript export.",
    "NBA/NAAC Reports Generator: Multi-parameter query filters, pagination, and CSV/JSON export.",
    "Global Policy Controls: Interactive CIE/SEE weight ratio sliders and CO target benchmarks."
]
for item in in_scope:
    p = tf.add_paragraph()
    p.text = f"• {item}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide7, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "🚀 Future Roadmap (Outside Current Scope)"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_CYAN

out_scope = [
    "Mobile Applications: Native Flutter / React Native mobile apps for student push alerts.",
    "AI Question Synthesis: Generative AI exam paper generation with Bloom's Taxonomy tagging.",
    "Biometric & RFID Attendance: Hardware IoT sensors for physical classroom attendance logging.",
    "University ERP Bridge: Integration with university fee payment and finance accounting systems."
]
for item in out_scope:
    p = tf.add_paragraph()
    p.text = f"• {item}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide7, 7)

# ==============================================================================
# SLIDE 8: TECHNOLOGY STACK (Clean 4 Cards, 13.5pt)
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
create_slide_background(slide8)
add_header(slide8, 8, "Technology Stack & Tooling", "Engineering Layers, Libraries, Languages, and DevOps")

tech_boxes = [
    ("🎨 Frontend", [
        ("Framework:", "Angular 18 Standalone"),
        ("Language:", "TypeScript 5.4 / JS"),
        ("Styling:", "CSS3, Flexbox, Grid"),
        ("State:", "RxJS Observables"),
        ("Theme:", "Dark Luxury Theme")
    ], COLOR_CYAN),
    ("⚙️ Backend & APIs", [
        ("Platform:", "Java 17 / Spring Boot"),
        ("Architecture:", "RESTful JSON APIs"),
        ("Client:", "Angular HttpClient"),
        ("Sync Bus:", "SyncService Broadcast"),
        ("Security:", "Role-Based Route Guards")
    ], COLOR_BLUE),
    ("💾 Database & Cache", [
        ("Database:", "MySQL / PostgreSQL"),
        ("Client Cache:", "LocalStorage Sync"),
        ("Data Models:", "TypeScript DTOs"),
        ("Export:", "CSV Streams, JSON, PDF"),
        ("Performance:", "Sub-50ms query filter")
    ], COLOR_GREEN),
    ("🛠️ Tools & DevOps", [
        ("IDE:", "Visual Studio Code"),
        ("Versioning:", "Git & GitHub"),
        ("Package:", "Node.js 20+ & npm"),
        ("Verification:", "Production Build (0 errors)"),
        ("Target:", "Modern Web Browsers")
    ], COLOR_GOLD)
]

for idx, (head, items, color) in enumerate(tech_boxes):
    card = add_card(slide8, 0.6 + idx*3.1, 1.55, 2.85, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.18)
    tf.margin_top = Inches(0.2)
    tf.margin_right = Inches(0.18)
    p = tf.paragraphs[0]
    p.text = head
    p.font.name = 'Calibri'
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = color
    
    for lbl, val in items:
        p = tf.add_paragraph()
        p.text = f"{lbl} {val}"
        p.font.name = 'Calibri'
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide8, 8)

# ==============================================================================
# SLIDE 9: SYSTEM ARCHITECTURE (4 Tiers, 14pt)
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
create_slide_background(slide9)
add_header(slide9, 9, "System Architecture", "Multi-Tier Client-Server Architecture with Reactive Data Flow")

arch_tiers = [
    ("1. Client Presentation Layer (Angular 18 SPA)", "Admin Console  |  Faculty Workload Deck  |  Student Results Portal  |  Accreditation Reports", "Responsive UI, Standalone Components, Material Design", COLOR_CYAN),
    ("2. Client Service & Reactive State Layer", "SyncService Event Bus  |  RoleGuard  |  ToastService  |  CourseService", "RxJS Subject Streams, LocalStorage Distributed Sync, Client-Side Pagination", COLOR_BLUE),
    ("3. API Gateway & Controller Layer", "REST API Endpoints (http://localhost:8080/api/users, /courses, /obe/marks)", "Spring Boot Controller Mappings, Input Validation, JSON Serialization", COLOR_GOLD),
    ("4. OBE Processing & Persistence Layer", "OBE Calculation Engine (SGPA/CGPA, CO Attainment, 12-PO Matrix, SAR Reports)", "MySQL / PostgreSQL Database, Schema Tables (Users, Courses, Marks, Mappings)", COLOR_GREEN)
]

for idx, (title, middle, sub, color) in enumerate(arch_tiers):
    card = add_card(slide9, 0.6, 1.55 + idx*1.32, 12.133, 1.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.14)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = f"Components: {middle}"
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_TEXT_WHITE
    
    p3 = tf.add_paragraph()
    p3.text = f"Technology: {sub}"
    p3.font.name = 'Calibri'
    p3.font.size = Pt(12)
    p3.font.color.rgb = COLOR_TEXT_MUTED

add_footer(slide9, 9)

# ==============================================================================
# SLIDE 10: MAJOR MODULES (4 Cards, 13.5pt)
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
create_slide_background(slide10)
add_header(slide10, 10, "Major System Modules", "Core Functional Units Across User Portals")

modules = [
    ("🏛️ Institutional Governance & Approvals", "User role management (Admin, Faculty, Student), academic approvals queue, and live institutional readiness index (92% NBA/NAAC compliance).", COLOR_CYAN),
    ("👨‍🏫 Faculty Workload & Course Allocation", "Dual-view interactive allocation matrix (By Faculty Deck & By Branch/Semester Matrix) with contact hours and credit caps for 6 departments.", COLOR_GOLD),
    ("📋 Student Academic Results & Marksheets", "Master-Detail expandable student cards displaying SGPA, CGPA, passed courses, nested subject marks, and instant transcript export.", COLOR_GREEN),
    ("📊 Accreditation Reports & Export Suite", "On-demand generator for NBA SAR Criterion 3 and NAAC 2.6 dossiers with search filters, pagination, and multi-format download (CSV/JSON/PDF).", COLOR_BLUE)
]

for idx, (title, desc, color) in enumerate(modules):
    card = add_card(slide10, 0.6, 1.55 + idx*1.32, 12.133, 1.18, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.16)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13.5)
    p2.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide10, 10)

# ==============================================================================
# SLIDE 11: UML & WORKFLOW (Clean 2-Col, 13.5pt)
# ==============================================================================
slide11 = prs.slides.add_slide(blank_layout)
create_slide_background(slide11)
add_header(slide11, 11, "UML & Process Workflow Design", "Role Use Cases and OBE Attainment Process Pipeline")

left_card = add_card(slide11, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
p = tf.paragraphs[0]
p.text = "👤 Role-Based Use Cases"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_CYAN

use_cases = [
    ("Chief Administrator (Dean / HOD):", "Sets academic year & weights (40/60); Allocates faculty courses; Reviews approvals; Generates NBA SAR dossiers."),
    ("Teaching Faculty (Professors):", "Views allocated subjects; Records internal CIE & final SEE marks; Maps test questions to COs; Tracks class attendance."),
    ("Enrolled Students:", "Accesses semester marksheet; Views SGPA/CGPA breakdowns; Downloads official PDF transcripts.")
]
for role, acts in use_cases:
    p = tf.add_paragraph()
    p.text = f"• {role}\n  {acts}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide11, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
p = tf.paragraphs[0]
p.text = "🔄 OBE Process Pipeline"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD

pipeline = [
    ("1. Curriculum Setup:", "Define Course Outcomes (CO1..CO5) and credits."),
    ("2. Mark Entry:", "Record Continuous CIE and Final SEE exam scores."),
    ("3. Weighted Sum:", "Calculate Final Score = (Internal * 40%) + (External * 60%)."),
    ("4. SGPA / CGPA:", "Compute semester GPA and cumulative CGPA."),
    ("5. Attainment & POs:", "Map % students achieving >= 75% to Washington Accord POs."),
    ("6. Instant Dossier:", "Export official PDF marksheet & NBA Criterion 3 report.")
]
for step, desc in pipeline:
    p = tf.add_paragraph()
    p.text = f"{step} {desc}"
    p.font.name = 'Calibri'
    p.font.size = Pt(12.5)
    p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide11, 11)

# ==============================================================================
# SLIDE 12: DATABASE DESIGN (Clean 4 Cards, 13pt)
# ==============================================================================
slide12 = prs.slides.add_slide(blank_layout)
create_slide_background(slide12)
add_header(slide12, 12, "Database Design & Schema", "Relational Schema Entities and Storage Architecture")

entities = [
    ("users", "id (PK), name, email, role, department, designation, password_hash", "Admin, Faculty, and Student accounts", COLOR_CYAN),
    ("courses", "code (PK), title, department, semester, credits, lectureHours, labHours", "Curriculum catalog for 6 branches", COLOR_BLUE),
    ("mark_entries", "id (PK), studentId (FK), courseCode (FK), obtainedMarks, maxMarks", "Assessment & Examination records", COLOR_GOLD),
    ("copo_mappings", "id (PK), coCode (FK), poCode (PO1..PO12), correlationLevel (1, 2, 3)", "Washington Accord 12-PO Matrix", COLOR_GREEN)
]

for idx, (tbl, cols, note, color) in enumerate(entities):
    col = idx % 2
    row = idx // 2
    card = add_card(slide12, 0.6 + col*6.2, 1.55 + row*2.6, 5.9, 2.45, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.2)
    tf.margin_top = Inches(0.18)
    p = tf.paragraphs[0]
    p.text = f"🗄️ {tbl}"
    p.font.name = 'Calibri'
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = f"Attributes: {cols}"
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_TEXT_BODY
    
    p3 = tf.add_paragraph()
    p3.text = f"Purpose: {note}"
    p3.font.name = 'Calibri'
    p3.font.size = Pt(12)
    p3.font.color.rgb = COLOR_GOLD_LIGHT

add_footer(slide12, 12)

# ==============================================================================
# SLIDE 13: SCREENSHOTS 1 (Larger Images, Clear 13pt Captions)
# ==============================================================================
slide13 = prs.slides.add_slide(blank_layout)
create_slide_background(slide13)
add_header(slide13, 13, "User Interface — Governance & Faculty Deck", "Production Screen Captures: Command Center & Workload Matrix")

left_card = add_card(slide13, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.2)
tf.margin_top = Inches(0.15)
p = tf.paragraphs[0]
p.text = "🏛️ Admin Command Center & Readiness Index"
p.font.name = 'Calibri'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD

admin_img_path = r"C:\Users\louki\.gemini\antigravity\brain\ae2b72d4-519e-436f-8866-38bd7736f1b3\.user_uploaded\media_1790829512566.png"
if os.path.exists(admin_img_path):
    slide13.shapes.add_picture(admin_img_path, Inches(0.8), Inches(2.05), width=Inches(5.5), height=Inches(3.4))

cap_box = slide13.shapes.add_textbox(Inches(0.8), Inches(5.6), Inches(5.5), Inches(0.95))
tf = cap_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Displays registered students/faculty rosters, active courses, pending approvals, and NBA/NAAC readiness gauge (92%)."
p.font.name = 'Calibri'
p.font.size = Pt(12)
p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide13, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.2)
tf.margin_top = Inches(0.15)
p = tf.paragraphs[0]
p.text = "👨‍🏫 Faculty Workload & Course Allocation Deck"
p.font.name = 'Calibri'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = COLOR_CYAN

fac_img_path = r"C:\Users\louki\.gemini\antigravity\brain\ae2b72d4-519e-436f-8866-38bd7736f1b3\.user_uploaded\media_1790860848643.png"
if os.path.exists(fac_img_path):
    slide13.shapes.add_picture(fac_img_path, Inches(7.0), Inches(2.05), width=Inches(5.5), height=Inches(3.4))

cap_box2 = slide13.shapes.add_textbox(Inches(7.0), Inches(5.6), Inches(5.5), Inches(0.95))
tf = cap_box2.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Dual-view allocation deck showing professor workload cards with contact hours, credit caps, and branch matrix switchers."
p.font.name = 'Calibri'
p.font.size = Pt(12)
p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide13, 13)

# ==============================================================================
# SLIDE 14: SCREENSHOTS 2 (Larger Images, Clear 13pt Captions)
# ==============================================================================
slide14 = prs.slides.add_slide(blank_layout)
create_slide_background(slide14)
add_header(slide14, 14, "User Interface — Results & Reports", "Production Screen Captures: Results Accordion & Reports Generator")

left_card = add_card(slide14, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.2)
tf.margin_top = Inches(0.15)
p = tf.paragraphs[0]
p.text = "📋 Student Results & Marksheet Accordion Deck"
p.font.name = 'Calibri'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = COLOR_GREEN

res_img_path = r"C:\Users\louki\.gemini\antigravity\brain\ae2b72d4-519e-436f-8866-38bd7736f1b3\.user_uploaded\media_1790832837162.png"
if os.path.exists(res_img_path):
    slide14.shapes.add_picture(res_img_path, Inches(0.8), Inches(2.05), width=Inches(5.5), height=Inches(3.4))

cap_box = slide14.shapes.add_textbox(Inches(0.8), Inches(5.6), Inches(5.5), Inches(0.95))
tf = cap_box.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Student results deck grouping courses by student ID, calculating SGPA/CGPA, and providing one-click official PDF transcripts."
p.font.name = 'Calibri'
p.font.size = Pt(12)
p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide14, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.2)
tf.margin_top = Inches(0.15)
p = tf.paragraphs[0]
p.text = "📊 Accreditation & Institutional Reports Generator"
p.font.name = 'Calibri'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD_LIGHT

rep_img_path = r"C:\Users\louki\.gemini\antigravity\brain\ae2b72d4-519e-436f-8866-38bd7736f1b3\.user_uploaded\media_1790864800663.png"
if os.path.exists(rep_img_path):
    slide14.shapes.add_picture(rep_img_path, Inches(7.0), Inches(2.05), width=Inches(5.5), height=Inches(3.4))

cap_box2 = slide14.shapes.add_textbox(Inches(7.0), Inches(5.6), Inches(5.5), Inches(0.95))
tf = cap_box2.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Generates NBA Criterion 3 & NAAC 2.6 dossiers with client-side search, pagination, and multi-format CSV/JSON/PDF exports."
p.font.name = 'Calibri'
p.font.size = Pt(12)
p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide14, 14)

# ==============================================================================
# SLIDE 15: TESTING & RESULTS (4 Key Tests, 13.5pt)
# ==============================================================================
slide15 = prs.slides.add_slide(blank_layout)
create_slide_background(slide15)
add_header(slide15, 15, "Testing Strategy & Verification Results", "Empirical Test Matrix and Quality Assurance Evidence")

table_shape = slide15.shapes.add_table(5, 4, Inches(0.6), Inches(1.55), Inches(12.133), Inches(4.3))
table = table_shape.table
table.columns[0].width = Inches(1.4)
table.columns[1].width = Inches(3.2)
table.columns[2].width = Inches(5.733)
table.columns[3].width = Inches(1.8)

headers = ["Test ID", "Test Scenario", "Verified Outcome", "Status"]
for i, h in enumerate(headers):
    cell = table.cell(0, i)
    cell.fill.solid()
    cell.fill.fore_color.rgb = COLOR_INNER_CARD
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.name = 'Calibri'
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = COLOR_GOLD

test_cases = [
    ("TC-01", "Role Route Guards", "Student blocked from accessing Admin console (/admin) and redirected.", "PASSED ✅"),
    ("TC-02", "Dynamic OBE Weight Sync", "Modifying CIE/SEE weights (40/60) immediately recalculates transcripts.", "PASSED ✅"),
    ("TC-03", "SGPA / CGPA Calculation", "Calculates weighted grade points divided by total credits with 2-decimal accuracy.", "PASSED ✅"),
    ("TC-04", "Production Build Check", "Angular production bundle (ng build --prod) compiled with 0 errors.", "PASSED ✅")
]

for row_idx, data in enumerate(test_cases, 1):
    for col_idx, text in enumerate(data):
        cell = table.cell(row_idx, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_CARD_BG if row_idx % 2 == 1 else COLOR_INNER_CARD
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.name = 'Calibri'
        p.font.size = Pt(13)
        if col_idx == 3:
            p.font.bold = True
            p.font.color.rgb = COLOR_GREEN
        elif col_idx == 0:
            p.font.bold = True
            p.font.color.rgb = COLOR_CYAN
        else:
            p.font.color.rgb = COLOR_TEXT_BODY

kpi_card = add_card(slide15, 0.6, 5.95, 12.133, 0.95, bg_color=COLOR_INNER_CARD, border_color=COLOR_GOLD)
tf = kpi_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.12)
p = tf.paragraphs[0]
p.text = "📊 Key Verified Performance Metrics:"
p.font.name = 'Calibri'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD_LIGHT

p2 = tf.add_paragraph()
p2.text = "• Production Compilation: Zero Errors (Angular 18 AOT)  • Sync Latency: < 50ms across tabs  • 100% Passing Test Suite"
p2.font.name = 'Calibri'
p2.font.size = Pt(13)
p2.font.color.rgb = COLOR_TEXT_WHITE

add_footer(slide15, 15)

# ==============================================================================
# SLIDE 16: CHALLENGES & SOLUTIONS (3 Cards, 13.5pt)
# ==============================================================================
slide16 = prs.slides.add_slide(blank_layout)
create_slide_background(slide16)
add_header(slide16, 16, "Technical Challenges & Solutions", "Key Engineering Roadblocks and Implemented Resolutions")

challenges = [
    ("Challenge 1: Real-Time Cross-Tab State Sync", 
     "When an Admin updated global OBE weights (40/60) in one tab, other open tabs (Results, Marksheets) remained stale until manual refresh.",
     "Engineered a reactive SyncService with browser storage events and RxJS Subjects to broadcast MARKS_CHANGED events instantly across tabs.",
     COLOR_CYAN),
    
    ("Challenge 2: Layout Width Overflow on Laptops",
     "The Accreditation Reports table pushed past screen borders on standard 1366x768 laptop resolutions due to fixed 1200px container width.",
     "Refactored reports layout into a 100% fluid grid with custom scrollbar wrappers, compact badges, and client-side pagination (10/20/50).",
     COLOR_GOLD),
    
    ("Challenge 3: Repetitive Student Rows in Results",
     "The results page initially listed each course as a separate flat row, repeating student names 7-8 times and cluttering review.",
     "Transformed the interface into a Master-Detail Expandable Accordion Deck grouping courses under unique student cards with live SGPA/CGPA.",
     COLOR_GREEN)
]

for idx, (title, problem, solution, color) in enumerate(challenges):
    card = add_card(slide16, 0.6, 1.55 + idx*1.75, 12.133, 1.62, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.14)
    tf.margin_right = Inches(0.25)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = f"• Problem: {problem}"
    p2.font.name = 'Calibri'
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = RGBColor(248, 113, 113)
    
    p3 = tf.add_paragraph()
    p3.text = f"✔ Resolution: {solution}"
    p3.font.name = 'Calibri'
    p3.font.size = Pt(12.5)
    p3.font.color.rgb = COLOR_GREEN

add_footer(slide16, 16)

# ==============================================================================
# SLIDE 17: TEAM ROLES (4 Clean Cards, 13.5pt)
# ==============================================================================
slide17 = prs.slides.add_slide(blank_layout)
create_slide_background(slide17)
add_header(slide17, 17, "Team Contributions & Roles", "Individual Ownership and Architectural Contributions")

team_members = [
    ("👨‍💻 V. Krishna Vamsi", "Project Lead & Full-Stack Architect", [
        "Architected Angular 18 Single Page Application and reactive SyncService.",
        "Implemented OBE Mathematical Engine (SGPA/CGPA, CO-PO Matrices).",
        "Designed Master-Detail Student Results Deck & Faculty Workload Deck."
    ], COLOR_GOLD),
    ("🎨 Frontend & UI/UX Specialist", "UI Designer & Component Engineer", [
        "Implemented modern Dark Luxury theme (Navy #0A1128, Gold #D4AF37).",
        "Built responsive grid layouts, custom scrollbar wrappers, and status badges.",
        "Engineered client-side pagination and real-time table search filters."
    ], COLOR_CYAN),
    ("⚙️ Backend & Persistence", "API & Schema Engineer", [
        "Structured relational database schema (Users, Courses, Marks, Mappings).",
        "Designed RESTful endpoint integrations and error-handling interceptors.",
        "Constructed client-side CSV and JSON export streams."
    ], COLOR_GREEN),
    ("📝 QA & Documentation", "Testing & Compliance Specialist", [
        "Formulated empirical test suite (Route guards, math formulas, builds).",
        "Mapped curriculum requirements to Washington Accord 12 Graduate Attributes.",
        "Compiled NBA SAR Criterion 3 and NAAC 2.6 accreditation documentation."
    ], COLOR_BLUE)
]

for idx, (name, role, tasks, color) in enumerate(team_members):
    col = idx % 2
    row = idx // 2
    card = add_card(slide17, 0.6 + col*6.2, 1.55 + row*2.6, 5.9, 2.45, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.18)
    tf.margin_right = Inches(0.25)
    p = tf.paragraphs[0]
    p.text = f"{name}  |  {role}"
    p.font.name = 'Calibri'
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = color
    
    for t in tasks:
        p = tf.add_paragraph()
        p.text = f"• {t}"
        p.font.name = 'Calibri'
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide17, 17)

# ==============================================================================
# SLIDE 18: FUTURE ROADMAP (4 Cards, 13.5pt)
# ==============================================================================
slide18 = prs.slides.add_slide(blank_layout)
create_slide_background(slide18)
add_header(slide18, 18, "Future Scope & Technology Roadmap", "Strategic Roadmap for Mobile and AI Integration")

future_items = [
    ("📱 1. Cross-Platform Mobile Apps", "Develop Flutter / React Native mobile applications for instant push notifications on marks, timetables, and attendance.", COLOR_CYAN),
    ("🤖 2. Generative AI Exam Synthesis", "Integrate LLM APIs to automatically generate university exam papers tagged with Bloom's Taxonomy levels mapped to Course Outcomes.", COLOR_GOLD),
    ("📡 3. Biometric & RFID Attendance", "Connect classroom hardware RFID readers directly to the attendance engine for automated real-time presence logging.", COLOR_GREEN),
    ("🏛️ 4. Direct e-NBA Portal Upload", "Build automated XML/JSON submission pipelines to upload validated SAR dossiers directly to national accreditation servers.", COLOR_BLUE)
]

for idx, (title, desc, color) in enumerate(future_items):
    card = add_card(slide18, 0.6, 1.55 + idx*1.32, 12.133, 1.18, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.16)
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Calibri'
    p.font.size = Pt(15.5)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13.5)
    p2.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide18, 18)

# ==============================================================================
# SLIDE 19: CONCLUSION & REFERENCES (Clean 2-Col, 13.5pt)
# ==============================================================================
slide19 = prs.slides.add_slide(blank_layout)
create_slide_background(slide19)
add_header(slide19, 19, "Conclusion & Academic References", "Executive Project Summary and Key Bibliography")

left_card = add_card(slide19, 0.6, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = left_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "🎯 Executive Conclusion"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_GOLD

conclusions = [
    "Successfully architected and developed Project SIDDHI, an Outcome-Based Learning Management System adhering to NBA Tier-1 and NAAC 2.6 standards.",
    "Eliminated manual calculation overhead by automating CIE/SEE weights (40/60), SGPA/CGPA transcripts, and 12-PO vectors.",
    "Delivered a luxury, responsive dark UI featuring dual-view faculty workload decks and expandable student marksheet accordions.",
    "Verified 100% production compilation readiness with zero errors on Angular 18."
]
for c in conclusions:
    p = tf.add_paragraph()
    p.text = f"✔ {c}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13.5)
    p.font.color.rgb = COLOR_TEXT_BODY

right_card = add_card(slide19, 6.8, 1.55, 5.9, 5.2, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
tf = right_card.text_frame
tf.word_wrap = True
tf.margin_left = Inches(0.25)
tf.margin_top = Inches(0.25)
tf.margin_right = Inches(0.25)
p = tf.paragraphs[0]
p.text = "📚 Academic References"
p.font.name = 'Calibri'
p.font.size = Pt(17)
p.font.bold = True
p.font.color.rgb = COLOR_CYAN

refs = [
    "[1] National Board of Accreditation (NBA), \"SAR Format for Tier-I Engineering Programs,\" New Delhi, 2023.",
    "[2] National Assessment and Accreditation Council (NAAC), \"Institutional Accreditation Manual,\" 2024.",
    "[3] Spady, William G., \"Outcome-Based Education: Critical Issues and Answers,\" AASA, Arlington, VA.",
    "[4] Angular Framework Team, \"Angular v18 Standalone Architecture Documentation,\" Google, 2026."
]
for r in refs:
    p = tf.add_paragraph()
    p.text = f"{r}"
    p.font.name = 'Calibri'
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide19, 19)

# ==============================================================================
# SLIDE 20: VIVA & DEMO CHECKLIST (6 Clean Cards, 14pt)
# ==============================================================================
slide20 = prs.slides.add_slide(blank_layout)
create_slide_background(slide20)
add_header(slide20, 20, "Viva & Demonstration Checklist", "Verification Checklist for Final Viva Defense")

checklist = [
    ("✔ 1. Live Application", "Running at http://localhost:4200 with zero console errors.", COLOR_GREEN),
    ("✔ 2. Role-Based Portals", "Admin Console (/admin), Faculty (/faculty), Student (/students).", COLOR_CYAN),
    ("✔ 3. Dynamic Faculty Deck", "Tested dual-view workload deck with contact hours and branch matrix.", COLOR_GOLD),
    ("✔ 4. Expandable Marksheets", "Demonstrated master-detail accordion deck with instant PDF print.", COLOR_GREEN),
    ("✔ 5. Accreditation Reports", "Live query generation of NBA SAR Criterion 3 and CSV/JSON export.", COLOR_BLUE),
    ("✔ 6. Production Build", "npx ng build --configuration=production passed with 0 errors.", COLOR_GOLD_LIGHT)
]

for idx, (item, note, color) in enumerate(checklist):
    col = idx % 2
    row = idx // 2
    card = add_card(slide20, 0.6 + col*6.2, 1.55 + row*1.75, 5.9, 1.6, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_top = Inches(0.18)
    tf.margin_right = Inches(0.25)
    p = tf.paragraphs[0]
    p.text = item
    p.font.name = 'Calibri'
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = color
    
    p2 = tf.add_paragraph()
    p2.text = note
    p2.font.name = 'Calibri'
    p2.font.size = Pt(13.5)
    p2.font.color.rgb = COLOR_TEXT_BODY

add_footer(slide20, 20)

# Save Final PPTX
siddhi_path = r"D:\OBLMSc\Project_SIDDHI_Final_Presentation.pptx"
prs.save(siddhi_path)
sys.stdout.write(f"SUCCESS: SIDDHI Presentation saved at {siddhi_path}\n")

output_path_v2 = r"D:\OBLMSc\Project_Final_Presentation_V2.pptx"
try:
    prs.save(output_path_v2)
    sys.stdout.write(f"SUCCESS: Presentation V2 saved at {output_path_v2}\n")
except Exception as e:
    sys.stdout.write(f"Note: Project_Final_Presentation_V2.pptx is open in PowerPoint. Saved as Project_SIDDHI_Final_Presentation.pptx.\n")

output_path = r"D:\OBLMSc\Project_Final_Presentation.pptx"
try:
    prs.save(output_path)
    sys.stdout.write(f"SUCCESS: Presentation saved at {output_path}\n")
except Exception as e:
    pass
