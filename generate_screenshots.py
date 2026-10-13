import os
import subprocess
import re

html_path = r"c:\Users\bhara\OneDrive\Desktop\s\github_mockups.html"
with open(html_path, "r", encoding="utf-8") as f:
    full_html = f.read()

style_match = re.search(r"<style>(.*?)</style>", full_html, re.DOTALL)
styles = style_match.group(1) if style_match else ""

views = [
    ("view-page1-collab-settings", "page1_collaboration_settings.png", 1200, 680),
    ("view-page1-team-members", "page1_team_members.png", 1200, 720),
    ("view-page2-create-project", "page2_create_project.png", 1200, 680),
    ("view-page2-initial-board", "page2_initial_board.png", 1200, 680),
    ("view-page3-parent-feature-issue", "page3_parent_feature_issue.png", 1200, 740),
    ("view-page3-main-features-board", "page3_main_features_board.png", 1200, 700),
    ("view-page5-notifications-parent", "page5_notifications_parent_issue.png", 1200, 740),
    ("view-page5-notification-sub-issues", "page5_notification_sub_issues.png", 1200, 700),
    ("view-page6-current-iteration", "page6_current_iteration.png", 1200, 680),
    ("view-page6-project-board-status", "page6_project_board_status.png", 1200, 740)
]

os.makedirs(r"c:\Users\bhara\OneDrive\Desktop\s\screenshots", exist_ok=True)
os.makedirs(r"c:\Users\bhara\OneDrive\Desktop\s\temp_views", exist_ok=True)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

for view_id, png_name, w, h in views:
    start_tag = f'<div id="{view_id}" class="gh-page-container">'
    start_idx = full_html.find(start_tag)
    if start_idx == -1:
        continue
    
    next_view_idx = full_html.find("<!-- VIEW", start_idx + len(start_tag))
    if next_view_idx == -1:
        next_view_idx = full_html.find("</body>", start_idx)
    
    content = full_html[start_idx:next_view_idx].strip()
    
    view_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{styles}
* {{
  scrollbar-width: none !important;
}}
*::-webkit-scrollbar {{
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}}
html, body {{
  margin: 0;
  padding: 0;
  overflow: hidden !important;
  background: #010409;
}}
.gh-page-container {{
  margin: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
  width: {w}px !important;
  min-height: {h}px !important;
  height: {h}px !important;
  overflow: hidden !important;
}}
</style>
</head>
<body>
{content}
</body>
</html>"""
    
    temp_html_path = os.path.join(r"c:\Users\bhara\OneDrive\Desktop\s\temp_views", f"{view_id}.html")
    with open(temp_html_path, "w", encoding="utf-8") as tf:
        tf.write(view_html)
    
    output_png = os.path.join(r"c:\Users\bhara\OneDrive\Desktop\s\screenshots", png_name)
    
    cmd = [
        chrome_exe,
        "--headless",
        "--disable-gpu",
        f"--screenshot={output_png}",
        f"--window-size={w},{h}",
        f"file:///{temp_html_path.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True)

print("Regenerated all clean screenshots without scrollbars!")
