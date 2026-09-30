import json

with open("D:/OBLMSc/scratch/generate_5_subjects.py", "r", encoding="utf-8") as f:
    content = f.read()

# Execute to get all_courses
namespace = {}
exec(content, namespace)
all_courses = namespace['all_courses']

ts_courses = []
for c in all_courses:
    cid = c['id']
    code = c['code']
    title = c['title'].replace("'", "\\'")
    faculty = c['faculty'].replace("'", "\\'")
    sem = c['semester']
    ts_courses.append(f"  {{ id: {cid}, code: '{code}', title: '{title}', faculty: '{faculty}', semester: '{sem}' }}")

ts_array_str = "export const DEFAULT_DATABASE_COURSES: AppCourse[] = [\n" + ",\n".join(ts_courses) + "\n];"

# Read course.service.ts
with open("D:/OBLMSc/outcome-based-lms/src/app/shared/services/course.service.ts", "r", encoding="utf-8") as f:
    service_ts = f.read()

import re
# Replace DEFAULT_DATABASE_COURSES = [...];
pattern = r"export const DEFAULT_DATABASE_COURSES: AppCourse\[\] = \[[\s\S]*?\];"
service_ts_updated = re.sub(pattern, ts_array_str, service_ts)

with open("D:/OBLMSc/outcome-based-lms/src/app/shared/services/course.service.ts", "w", encoding="utf-8") as f:
    f.write(service_ts_updated)

print("Updated course.service.ts successfully with 200 courses (5 per semester).")
