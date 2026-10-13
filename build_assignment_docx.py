import os
import zipfile
import shutil

DOCX_OUTPUT = r"c:\Users\bhara\OneDrive\Desktop\s\SESD_Assignment_5_Student_Attendance_Tracker.docx"
SCREENSHOTS_DIR = r"c:\Users\bhara\OneDrive\Desktop\s\screenshots"

# Image files in order of appearance
image_files = [
    ("image1.png", "page1_collaboration_settings.png", "Figure 1.1: Repository Collaboration and Access Settings"),
    ("image2.png", "page1_team_members.png", "Figure 1.2: Repository Collaborators & Scrum Team Roster"),
    ("image3.png", "page2_create_project.png", "Figure 2.1: Creating the GitHub Project Board"),
    ("image4.png", "page2_initial_board.png", "Figure 2.2: Initial Project Kanban Board with Scrum Columns"),
    ("image5.png", "page3_parent_feature_issue.png", "Figure 3.1: Parent Feature Issue #1 - Student Attendance Management"),
    ("image6.png", "page3_main_features_board.png", "Figure 3.2: Main Product Feature Issues on Project Backlog Board"),
    ("image7.png", "page5_notifications_parent_issue.png", "Figure 5.1: Notifications and Alerts Feature Parent Issue #5"),
    ("image8.png", "page5_notification_sub_issues.png", "Figure 5.2: Notification Feature Decomposed Sub-issues List"),
    ("image9.png", "page6_current_iteration.png", "Figure 6.1: Current Iteration 3 Sprint Progress & Milestone View"),
    ("image10.png", "page6_project_board_status.png", "Figure 6.2: GitHub Project Board Showing Real-time Issue Workflow Status")
]

# Build [Content_Types].xml
content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

# Build _rels/.rels
root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

# Build word/_rels/document.xml.rels
doc_rels_items = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
]
for idx, (img_name, orig_name, caption) in enumerate(image_files, 1):
    doc_rels_items.append(f'<Relationship Id="rIdImg{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{img_name}"/>')

document_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {"".join(doc_rels_items)}
</Relationships>"""

# Basic styles.xml
styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="262626"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
</w:styles>"""

def p(text="", bold=False, size=22, color="262626", space_after=140, align="left", italic=False):
    bold_tag = "<w:b/>" if bold else ""
    italic_tag = "<w:i/>" if italic else ""
    align_tag = f'<w:jc w:val="{align}"/>' if align != "left" else ""
    return f"""<w:p>
      <w:pPr>{align_tag}<w:spacing w:after="{space_after}" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:r>
        <w:rPr>{bold_tag}{italic_tag}<w:sz w:val="{size}"/><w:color w:val="{color}"/></w:rPr>
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""

def h1(title):
    return f"""<w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="140"/>
        <w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="0969DA"/></w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="0969DA"/></w:rPr>
        <w:t>{title}</w:t>
      </w:r>
    </w:p>"""

def h2(title):
    return f"""<w:p>
      <w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2328"/></w:rPr>
        <w:t>{title}</w:t>
      </w:r>
    </w:p>"""

def h3(title):
    return f"""<w:p>
      <w:pPr><w:spacing w:before="140" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="24292F"/></w:rPr>
        <w:t>{title}</w:t>
      </w:r>
    </w:p>"""

def bullet(text, bold_prefix="", level=0):
    b_prefix = f'<w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="24292F"/></w:rPr><w:t xml:space="preserve">{bold_prefix} </w:t></w:r>' if bold_prefix else ""
    return f"""<w:p>
      <w:pPr>
        <w:ind w:left="480" w:hanging="240"/>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:color w:val="0969DA"/></w:rPr>
        <w:t>• </w:t>
      </w:r>
      {b_prefix}
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:color w:val="262626"/></w:rPr>
        <w:t xml:space="preserve">{text}</w:t>
      </w:r>
    </w:p>"""

def img(rId, caption, width=5486400, height=3097520): # ~6.0 x 3.38 inches
    return f"""<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="140" w:after="60"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="{width}" cy="{height}"/>
            <wp:docPr id="1" name="Screenshot"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Screenshot"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="{rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="{width}" cy="{height}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    <a:ln w="12700"><a:solidFill><a:srgbClr val="D0D7DE"/></a:solidFill></a:ln>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="180"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="57606A"/></w:rPr>
        <w:t>{caption}</w:t>
      </w:r>
    </w:p>"""

def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

# Assemble document body
body_parts = []

# Title & Metadata Banner
body_parts.append(p("SOFTWARE ENGINEERING &amp; SYSTEM DESIGN (SESD)", bold=True, size=24, color="0969DA", space_after=40, align="center"))
body_parts.append(p("ASSIGNMENT – 5 : SCRUM &amp; GITHUB COLLABORATION", bold=True, size=32, color="1F2328", space_after=120, align="center"))
body_parts.append(p("Project Title: Student Attendance Tracker", bold=True, size=24, color="24292F", space_after=60, align="center"))
body_parts.append(p("Project Flow: Login → Mark Attendance → View Attendance Reports → Receive Notifications", bold=True, size=20, color="0969DA", space_after=200, align="center"))

# PAGE 1
body_parts.append(h1("Page 1: GitHub Collaboration"))
body_parts.append(h2("Repository Collaboration and Team Setup"))
body_parts.append(h3("Collaboration"))
body_parts.append(p("The repository collaboration area is used to manage access and team participation in the Student Attendance Tracker project. Organization-level branch protections, review mandates, and role hierarchies ensure strict quality control throughout development."))
body_parts.append(h3("Team Members"))
body_parts.append(p("The repository contains the project team members who collaborate on development, testing, and integration across three planned Scrum sprints."))
body_parts.append(img("rIdImg1", "Figure 1.1: Repository Collaboration and Access Settings"))
body_parts.append(img("rIdImg2", "Figure 1.2: Repository Collaborators &amp; Scrum Team Roster"))
body_parts.append(page_break())

# PAGE 2
body_parts.append(h1("Page 2: GitHub Project"))
body_parts.append(h2("Project Creation and Initial Board"))
body_parts.append(h3("Create Project"))
body_parts.append(p("A GitHub Project is created for the Student Attendance Tracker. The repository issues are added to the project to organize the development tasks into structured Scrum backlog items and track progress through iterative iterations."))
body_parts.append(h3("Initial Board"))
body_parts.append(p("The project board provides a central place to organize issues and track their progress through different stages: Todo, In Progress, Review, and Done."))
body_parts.append(img("rIdImg3", "Figure 2.1: Creating the GitHub Project Board"))
body_parts.append(img("rIdImg4", "Figure 2.2: Initial Project Kanban Board with Scrum Columns"))
body_parts.append(page_break())

# PAGE 3
body_parts.append(h1("Page 3: Feature Issue and Backlog"))
body_parts.append(h2("Student Attendance Management"))
body_parts.append(h3("Student Attendance"))
body_parts.append(p("The Student Attendance feature is created as a parent issue. It defines the core functional requirements for recording, storing, and displaying student attendance."))
body_parts.append(h3("Main Requirements"))
body_parts.append(bullet("Record attendance as Present or Absent."))
body_parts.append(bullet("Store attendance date, subject code, and student details."))
body_parts.append(bullet("Allow authorized faculty to mark attendance."))
body_parts.append(bullet("Display attendance records and compute percentages in real-time."))
body_parts.append(bullet("Prevent duplicate attendance entries for the same student and session."))
body_parts.append(h3("Feature List"))
body_parts.append(p("The project board contains the following main feature issues:"))
body_parts.append(bullet("User Login and Authentication", "1."))
body_parts.append(bullet("Attendance Marking", "2."))
body_parts.append(bullet("Attendance Reports", "3."))
body_parts.append(bullet("Notifications", "4."))
body_parts.append(img("rIdImg5", "Figure 3.1: Parent Feature Issue #1 - Student Attendance Management"))
body_parts.append(img("rIdImg6", "Figure 3.2: Main Product Feature Issues on Project Backlog Board"))
body_parts.append(page_break())

# PAGE 4
body_parts.append(h1("Page 4: Product Backlog"))
body_parts.append(p("Each main feature is divided into smaller Sub-issues so that the team can implement and track the work step by step:"))
body_parts.append(h2("1. User Login and Authentication"))
body_parts.append(bullet("Create login page."))
body_parts.append(bullet("Add student and faculty login."))
body_parts.append(bullet("Validate username and password."))
body_parts.append(bullet("Implement role-based access."))
body_parts.append(bullet("Test login functionality."))
body_parts.append(h2("2. Attendance Marking"))
body_parts.append(bullet("Select class or subject."))
body_parts.append(bullet("Display student list."))
body_parts.append(bullet("Mark students Present or Absent."))
body_parts.append(bullet("Save attendance records."))
body_parts.append(bullet("Test attendance marking."))
body_parts.append(h2("3. Attendance Reports"))
body_parts.append(bullet("Retrieve attendance records."))
body_parts.append(bullet("Display daily attendance."))
body_parts.append(bullet("Calculate attendance percentage."))
body_parts.append(bullet("Generate student-wise reports."))
body_parts.append(bullet("Test report generation."))
body_parts.append(h2("4. Notifications"))
body_parts.append(bullet("Notify students about attendance updates."))
body_parts.append(bullet("Send low-attendance alerts."))
body_parts.append(bullet("Notify students when attendance records are updated."))
body_parts.append(bullet("Integrate notifications with attendance reports."))
body_parts.append(bullet("Test notification functionality."))
body_parts.append(p("The parent issue becomes complete when its related Sub-issues are completed.", italic=True, color="57606A", space_after=180))
body_parts.append(page_break())

# PAGE 5
body_parts.append(h1("Page 5: Notifications Feature"))
body_parts.append(h2("Notifications and Alerts"))
body_parts.append(p("The Notifications feature is planned as the fourth main product feature."))
body_parts.append(h3("Notification Tasks"))
body_parts.append(bullet("Attendance update notification.", "1."))
body_parts.append(bullet("Low-attendance alert (<75% threshold).", "2."))
body_parts.append(bullet("Attendance correction notification.", "3."))
body_parts.append(bullet("Notification delivery status.", "4."))
body_parts.append(bullet("Notification testing and validation.", "5."))
body_parts.append(h3("Integration"))
body_parts.append(p("The notification module is integrated with attendance marking and attendance reports so students can receive immediate updates when sessions are recorded or when attendance drops below the statutory requirement."))
body_parts.append(img("rIdImg7", "Figure 5.1: Notifications Parent Issue #5 Specification"))
body_parts.append(img("rIdImg8", "Figure 5.2: Notification Sub-issues Breakdown Table"))
body_parts.append(page_break())

# PAGE 6
body_parts.append(h1("Page 6: GitHub Project Board"))
body_parts.append(h2("Project Board and Current Iteration"))
body_parts.append(h3("Current Iteration"))
body_parts.append(p("The current iteration groups tasks according to the team's sprint plan. Iteration 3 focuses on Reports and Notifications with 83% completion rate."))
body_parts.append(h3("Workflow Stages"))
body_parts.append(bullet("Todo: Work items planned and waiting for sprint pick-up."))
body_parts.append(bullet("In Progress: Items actively undergoing code development."))
body_parts.append(bullet("Review: Code submitted via Pull Request undergoing peer evaluation."))
body_parts.append(bullet("Done: Merged, tested, and accepted product increments."))
body_parts.append(h3("Purpose"))
body_parts.append(p("The project board provides a visual view of completed work, ongoing tasks, and remaining work, fostering transparent communication among all Scrum members."))
body_parts.append(img("rIdImg9", "Figure 6.1: Current Iteration 3 Progress and Milestone Tracking"))
body_parts.append(img("rIdImg10", "Figure 6.2: GitHub Project Board with Active Scrum Workflow Stages"))
body_parts.append(page_break())

# PAGE 7
body_parts.append(h1("Page 7: About the Project"))
body_parts.append(h2("Student Attendance Tracker"))
body_parts.append(p("The Student Attendance Tracker is a Scrum-based software project designed to simplify attendance management in an educational institution. It allows faculty to mark attendance, students to view their attendance percentage, and the system to generate reports and notifications."))
body_parts.append(h3("Team Responsibilities"))
body_parts.append(bullet("manukanta — User Login and Authentication"))
body_parts.append(bullet("umender — Attendance Marking"))
body_parts.append(bullet("jagan — Attendance Reports"))
body_parts.append(bullet("sai ram — Notifications"))
body_parts.append(h3("Product Goal"))
body_parts.append(p("Login → Mark Attendance → View Attendance Reports → Receive Notifications", bold=True, color="0969DA"))
body_parts.append(h3("How the Team Is Developing It"))
body_parts.append(p("Product Backlog → Sprint Planning → Sprint → Daily Scrum → Development → Sprint Review → Sprint Retrospective → Next Sprint", bold=True, color="1F2328"))
body_parts.append(page_break())

# PAGE 8
body_parts.append(h1("Page 8: Sprint 1 — User Login and Authentication"))
body_parts.append(h2("Sprint Details"))
body_parts.append(p("Assigned Member: Vamshi", bold=True, size=24, color="0969DA"))
body_parts.append(h3("Sprint Tasks"))
body_parts.append(bullet("Design the login page.", "1."))
body_parts.append(bullet("Implement student and faculty login.", "2."))
body_parts.append(bullet("Validate login credentials.", "3."))
body_parts.append(bullet("Add role-based access.", "4."))
body_parts.append(bullet("Test login functionality.", "5."))
body_parts.append(h3("Sprint Goal"))
body_parts.append(p("Allow authorized students and faculty to log in to the Student Attendance Tracker."))
body_parts.append(h3("Sprint 1 Output"))
body_parts.append(p("A working authentication module that provides secure access to the attendance system with session verification and distinct dashboards for students and faculty."))
body_parts.append(page_break())

# PAGE 9
body_parts.append(h1("Page 9: Sprint 2 — Attendance Marking"))
body_parts.append(h2("Sprint Details"))
body_parts.append(p("Assigned Member: Eswar", bold=True, size=24, color="0969DA"))
body_parts.append(h3("Sprint Tasks"))
body_parts.append(bullet("Select class or subject.", "1."))
body_parts.append(bullet("Display the student list.", "2."))
body_parts.append(bullet("Mark attendance as Present or Absent.", "3."))
body_parts.append(bullet("Save attendance records with the date.", "4."))
body_parts.append(bullet("Prevent duplicate entries.", "5."))
body_parts.append(bullet("Test attendance marking.", "6."))
body_parts.append(h3("Sprint Goal"))
body_parts.append(p("Allow faculty to record student attendance accurately and efficiently."))
body_parts.append(h3("Sprint 2 Output"))
body_parts.append(p("A working attendance-marking module that stores attendance records for report generation and prevents duplicate entries for the same subject and session."))
body_parts.append(page_break())

# PAGE 10
body_parts.append(h1("Page 10: Sprint 3 — Reports, Notifications and Integration"))
body_parts.append(h2("Attendance Reports — Rishikesh"))
body_parts.append(bullet("Retrieve attendance records."))
body_parts.append(bullet("Display daily attendance."))
body_parts.append(bullet("Calculate attendance percentage."))
body_parts.append(bullet("Generate student-wise reports."))
body_parts.append(bullet("Test report generation."))
body_parts.append(h2("Notifications — Nithish and Entire Team"))
body_parts.append(bullet("Send attendance update notifications."))
body_parts.append(bullet("Generate low-attendance alerts (<75%)."))
body_parts.append(bullet("Notify students about attendance corrections."))
body_parts.append(bullet("Test notifications."))
body_parts.append(bullet("Integrate all modules."))
body_parts.append(h3("Sprint Goal"))
body_parts.append(p("Connect authentication, attendance marking, reports, and notifications to produce a complete Student Attendance Tracker."))
body_parts.append(h3("Sprint 3 Output"))
body_parts.append(p("An integrated system that allows users to log in, manage attendance, view reports, and receive notifications seamlessly."))
body_parts.append(page_break())

# PAGE 11
body_parts.append(h1("Page 11: GitHub Workflow and Final Progress"))
body_parts.append(h2("GitHub Workflow"))
body_parts.append(p("Issues → Sub-issues → Todo → In Progress → Review → Done", bold=True, color="0969DA", size=24))
body_parts.append(h3("Scrum Activities"))
body_parts.append(bullet("Team members discuss completed work, planned work, and blockers.", "Daily Scrum:"))
body_parts.append(bullet("The team demonstrates the features completed during the sprint.", "Sprint Review:"))
body_parts.append(bullet("The team discusses what went well, what went wrong, and what can be improved.", "Sprint Retrospective:"))
body_parts.append(h2("Final Progress"))
body_parts.append(p("Sprint 1: User Login and Authentication\n↓\nSprint 2: Attendance Marking\n↓\nSprint 3: Attendance Reports + Notifications + Integration\n↓\nFinal Student Attendance Tracker", bold=True, color="1F2328", size=22))
body_parts.append(h3("Conclusion"))
body_parts.append(p("The Student Attendance Tracker uses Scrum practices and GitHub collaboration tools to organize and monitor software development. GitHub Issues, Sub-issues, Iterations, Project Board, commits, and pull requests help the team track tasks and work together efficiently."))

# Final document XML structure
document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    {"".join(body_parts)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

# Write to zip (.docx)
with zipfile.ZipFile(DOCX_OUTPUT, "w", zipfile.ZIP_DEFLATED) as docx:
    docx.writestr("[Content_Types].xml", content_types)
    docx.writestr("_rels/.rels", root_rels)
    docx.writestr("word/styles.xml", styles_xml)
    docx.writestr("word/document.xml", document_xml)
    docx.writestr("word/_rels/document.xml.rels", document_rels)
    
    # Add media files
    for img_name, orig_name, caption in image_files:
        orig_path = os.path.join(SCREENSHOTS_DIR, orig_name)
        if os.path.exists(orig_path):
            docx.write(orig_path, f"word/media/{img_name}")
            print(f"Added {img_name} from {orig_name}")
        else:
            print(f"Warning: could not find {orig_path}")

print(f"Successfully generated DOCX at {DOCX_OUTPUT}")
