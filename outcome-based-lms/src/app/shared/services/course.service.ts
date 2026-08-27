import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AppCourse {
  id: number;
  code: string;
  title: string;
  faculty: string;
  semester: string;
}

export const DEFAULT_DATABASE_COURSES: AppCourse[] = [
  { id: 1, code: 'CS101', title: 'Database Management Systems', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 2, code: 'CS102', title: 'Data Structures & Algorithms', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
  { id: 3, code: 'CS103', title: 'Object-Oriented Programming with Java', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 4, code: 'CS201', title: 'Operating Systems', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
  { id: 5, code: 'CS202', title: 'Machine Learning & Data Science', faculty: 'Prof. Sunita Sharma', semester: 'Semester 5' },
  { id: 6, code: 'CS301', title: 'Computer Networks', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 7, code: 'CS302', title: 'Software Engineering & Agile Methodologies', faculty: 'Prof. Rajesh Verma', semester: 'Semester 6' },
  { id: 8, code: 'CS303', title: 'Cloud Computing & DevOps', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
  { id: 9, code: 'CS401', title: 'Artificial Intelligence', faculty: 'Dr. Ramesh Babu', semester: 'Semester 7' },
  { id: 10, code: 'CS402', title: 'Cyber Security & Cryptography', faculty: 'Prof. Rajesh Verma', semester: 'Semester 7' }
];

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/courses';

  private coursesSubject = new BehaviorSubject<AppCourse[]>(this.getCoursesSync());
  public courses$ = this.coursesSubject.asObservable();

  constructor() {
    this.ensureCoursesInitialized();
    this.syncFromBackend();
  }

  /**
   * Ensures courses are present in localStorage
   */
  public ensureCoursesInitialized(): AppCourse[] {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.syncCourseSubjects(parsed);
          return parsed;
        }
      }
    } catch {}

    // Initialize with default accredited courses
    const defaults = [...DEFAULT_DATABASE_COURSES];
    try {
      localStorage.setItem('obslmsCourses', JSON.stringify(defaults));
      this.syncCourseSubjects(defaults);
    } catch {}
    return defaults;
  }

  private syncCourseSubjects(courses: AppCourse[]): void {
    try {
      const courseSubjects = courses.map(c => ({
        id: c.id.toString(),
        courseId: c.id.toString(),
        courseName: c.title,
        subjectId: c.code,
        subjectName: c.title,
        credits: 4
      }));
      localStorage.setItem('obslmsCourseSubjects', JSON.stringify(courseSubjects));
    } catch {}
  }

  /**
   * Synchronous getter for current courses
   */
  public getCoursesSync(): AppCourse[] {
    return this.ensureCoursesInitialized();
  }

  /**
   * Fetch courses from backend API or fallback to localStorage
   */
  public getCourses(): Observable<AppCourse[]> {
    return this.http.get<AppCourse[]>(this.apiUrl).pipe(
      tap(courses => {
        if (Array.isArray(courses) && courses.length > 0) {
          localStorage.setItem('obslmsCourses', JSON.stringify(courses));
          this.syncCourseSubjects(courses);
          this.coursesSubject.next(courses);
        } else {
          // If backend has 0 courses, seed backend
          const local = this.ensureCoursesInitialized();
          local.forEach(c => this.http.post(this.apiUrl, c).subscribe());
          this.coursesSubject.next(local);
        }
      }),
      catchError(() => {
        const local = this.ensureCoursesInitialized();
        this.coursesSubject.next(local);
        return of(local);
      })
    );
  }

  /**
   * Background sync from backend
   */
  public syncFromBackend(): void {
    this.http.get<AppCourse[]>(this.apiUrl).subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          localStorage.setItem('obslmsCourses', JSON.stringify(courses));
          this.syncCourseSubjects(courses);
          this.coursesSubject.next(courses);
        } else {
          const local = this.ensureCoursesInitialized();
          local.forEach(c => this.http.post(this.apiUrl, c).subscribe());
        }
      },
      error: () => {
        // Backend offline, keep local database
      }
    });
  }

  /**
   * Save a course (Create or Update)
   */
  public saveCourse(course: Partial<AppCourse>): Observable<AppCourse> {
    const isEdit = !!course.id && Number(course.id) > 0;
    const courseId = isEdit ? Number(course.id) : Date.now();
    const fullCourse: AppCourse = {
      id: courseId,
      code: (course.code || 'CRS').trim().toUpperCase(),
      title: (course.title || '').trim(),
      faculty: (course.faculty || 'Faculty Board').trim(),
      semester: (course.semester || 'Semester 1').trim()
    };

    const current = this.getCoursesSync();
    if (isEdit) {
      const idx = current.findIndex(c => c.id === fullCourse.id || c.code === fullCourse.code);
      if (idx >= 0) {
        current[idx] = fullCourse;
      } else {
        current.unshift(fullCourse);
      }
    } else {
      current.unshift(fullCourse);
    }

    try {
      localStorage.setItem('obslmsCourses', JSON.stringify(current));
      this.syncCourseSubjects(current);
      this.coursesSubject.next(current);
    } catch {}

    // Sync to backend
    return this.http.post<AppCourse>(this.apiUrl, fullCourse).pipe(
      catchError(() => of(fullCourse))
    );
  }

  /**
   * Delete a course
   */
  public deleteCourse(id: number | string): Observable<any> {
    const current = this.getCoursesSync().filter(c => c.id.toString() !== id.toString());
    try {
      localStorage.setItem('obslmsCourses', JSON.stringify(current));
      this.syncCourseSubjects(current);
      this.coursesSubject.next(current);
    } catch {}

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of({ success: true }))
    );
  }

  /**
   * Assign faculty to a course
   */
  public assignFaculty(course: AppCourse, facultyName: string): Observable<any> {
    course.faculty = facultyName;
    return this.saveCourse(course);
  }
}
