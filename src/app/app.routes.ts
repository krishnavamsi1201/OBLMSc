import { Routes } from '@angular/router';
import { Admin } from './pages/admin/admin';
import { Assessments } from './pages/assessments/assessments';
import { Attainment } from './pages/attainment/attainment';
import { CopoMapping } from './pages/copo-mapping/copo-mapping';
import { Courses } from './pages/courses/courses';
import { Dashboard } from './pages/dashboard/dashboard';
import { Subjects } from './pages/subjects/subjects';
import { CourseOutcomes } from './pages/course-outcomes/course-outcomes';
import { ProgramOutcomes } from './pages/program-outcomes/program-outcomes';
import { CoAttainment } from './pages/co-attainment/co-attainment';
import { PoAttainment } from './pages/po-attainment/po-attainment';
import { AttendancePage } from './pages/attendance/attendance';
import { Timetable } from './pages/timetable/timetable';
import { Results } from './pages/results/results';
import { Feedback } from './pages/feedback/feedback';
import { Notifications } from './pages/notifications/notifications';
import { Profile } from './pages/profile/profile';
import { Performance } from './pages/performance/performance';
import { Faculty } from './pages/faculty/faculty';
import { Login } from './pages/login/login';
import { Outcomes } from './pages/outcomes/outcomes';
import { Reports } from './pages/reports/reports';
import { Settings } from './pages/settings/settings';
import { SettingsSecurity } from './pages/settings-security/settings-security';
import { SettingsAppearance } from './pages/settings-appearance/settings-appearance';
import { SettingsTeachingPreferences } from './pages/settings-teaching-preferences/settings-teaching-preferences';
import { SettingsDataReports } from './pages/settings-data-reports/settings-data-reports';
import { SettingsSystem } from './pages/settings-system/settings-system';
import { Students } from './pages/students/students';
import { Users } from './pages/users/users';
import { Chatbot } from './pages/chatbot/chatbot';
import { Examination } from './pages/examination/examination';
import { Grievance } from './pages/grievance/grievance';
import { QuestionBank } from './pages/question-bank/question-bank';
import { FacultyManagement } from './pages/admin/faculty-management/faculty-management';
import { StudentManagement } from './pages/admin/student-management/student-management';
import { CourseSubjectAssignment } from './pages/admin/course-subject-assignment/course-subject-assignment';
import { FacultyCourseAllocation } from './pages/admin/faculty-course-allocation/faculty-course-allocation';
import { AssessmentCOMapping } from './pages/admin/assessment-co-mapping/assessment-co-mapping';
import { ApprovalManagement } from './pages/admin/approval-management/approval-management';
import { RoleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'dashboard',
    component: Dashboard, 
  },
  
  {
    path: 'courses',
    component: Courses,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'subjects',
    component: Subjects,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'course-outcomes',
    component: CourseOutcomes,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'program-outcomes',
    component: ProgramOutcomes,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'co-attainment',
    component: CoAttainment,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'po-attainment',
    component: PoAttainment,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'attendance',
    component: AttendancePage,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'performance',
    component: Performance,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'timetable',
    component: Timetable,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'results',
    component: Results,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'feedback',
    component: Feedback,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'notifications',
    component: Notifications,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'outcomes',
    component: Outcomes,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'copo-mapping',
    component: CopoMapping,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'attainment',
    component: Attainment,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'assessments',
    component: Assessments,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'examination',
    component: Examination,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'grievance',
    component: Grievance,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'question-bank',
    component: QuestionBank,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'students',
    component: Students,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'student'] }
  },
  {
    path: 'reports',
    component: Reports,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'settings',
    pathMatch: 'full',
    component: Settings,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'settings/security',
    component: SettingsSecurity,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'settings/appearance',
    component: SettingsAppearance,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty', 'student'] }
  },
  {
    path: 'settings/teaching-preferences',
    component: SettingsTeachingPreferences,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'settings/data-reports',
    component: SettingsDataReports,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'settings/system',
    component: SettingsSystem,
    canActivate: [RoleGuard],
    data: { roles: ['admin', 'faculty'] }
  },
  {
    path: 'faculty',
    component: Faculty,
    canActivate: [RoleGuard],
    data: { roles: ['faculty'] }
  },
  {
    path: 'users',
    component: Users,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/faculty-management',
    component: FacultyManagement,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/student-management',
    component: StudentManagement,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/course-subject-assignment',
    component: CourseSubjectAssignment,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/faculty-course-allocation',
    component: FacultyCourseAllocation,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/assessment-co-mapping',
    component: AssessmentCOMapping,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/approval-management',
    component: ApprovalManagement,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'chatbot',
    component: Chatbot
  },
  {
  path: 'access-denied',
  redirectTo: 'login'
},
  {
    path: '**',
    redirectTo: 'login'
  }
];