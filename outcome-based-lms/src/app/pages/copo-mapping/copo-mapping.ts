import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DEFAULT_DATABASE_COURSES } from '../../shared/services/course.service';
import { NavigationService } from '../../shared/services/navigation.service';

interface ProgramOutcome {
  id: number;
  poNumber: string;
  description: string;
}

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description?: string;
}

interface CoMapping {
  id: number;
  course: string;
  co: string;
  po: string;
  contribution: number;
  mappingLevel: number;
  status: 'Pending' | 'Approved';
}

const DEFAULT_PROGRAM_OUTCOMES: ProgramOutcome[] = [
  { id: 1, poNumber: 'PO1', description: 'Engineering Knowledge: Apply mathematics, science, and core engineering fundamentals.' },
  { id: 2, poNumber: 'PO2', description: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex problems.' },
  { id: 3, poNumber: 'PO3', description: 'Design & Development of Solutions: Design system components and processes meeting specified technical needs.' },
  { id: 4, poNumber: 'PO4', description: 'Conduct Investigations of Complex Problems: Use research-based methods and experimental analysis.' },
  { id: 5, poNumber: 'PO5', description: 'Modern Tool Usage: Select and apply appropriate techniques, modern tools, and simulation software.' },
  { id: 6, poNumber: 'PO6', description: 'The Engineer and Society: Apply contextual knowledge to assess societal, health, safety, and legal issues.' },
  { id: 7, poNumber: 'PO7', description: 'Environment and Sustainability: Understand the impact of professional engineering solutions in societal contexts.' },
  { id: 8, poNumber: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities.' },
  { id: 9, poNumber: 'PO9', description: 'Individual and Team Work: Function effectively as an individual, member or leader in diverse teams.' },
  { id: 10, poNumber: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities with the engineering community.' },
  { id: 11, poNumber: 'PO11', description: 'Project Management and Finance: Demonstrate knowledge and understanding of management principles.' },
  { id: 12, poNumber: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent learning.' }
];

export const DEFAULT_INITIAL_COS: CourseOutcome[] = [
  // 1. CSE
  { id: 1, course: 'CS101', co: 'CO1', description: 'Explain database architecture, schema design, and entity-relationship models.' },
  { id: 2, course: 'CS101', co: 'CO2', description: 'Formulate relational algebra queries and complex SQL queries.' },
  { id: 3, course: 'CS101', co: 'CO3', description: 'Apply normalization techniques (1NF to BCNF) to eliminate database redundancies.' },
  { id: 4, course: 'CS101', co: 'CO4', description: 'Implement transaction management and concurrency control protocols.' },
  { id: 5, course: 'CS101', co: 'CO5', description: 'Demonstrate indexing, hashing, and database tuning strategies.' },
  
  { id: 6, course: 'CS102', co: 'CO1', description: 'Analyze asymptotic time and space complexity of algorithms.' },
  { id: 7, course: 'CS102', co: 'CO2', description: 'Design linear data structures including linked lists, stacks, and queues.' },
  { id: 8, course: 'CS102', co: 'CO3', description: 'Implement non-linear data structures including binary trees, AVL trees, and heaps.' },
  { id: 9, course: 'CS102', co: 'CO4', description: 'Apply graph traversal algorithms (BFS, DFS) and shortest path algorithms.' },
  { id: 10, course: 'CS102', co: 'CO5', description: 'Evaluate searching, sorting, and hashing techniques for problem solving.' },

  { id: 11, course: 'CS103', co: 'CO1', description: 'Understand OOP concepts: encapsulation, inheritance, and polymorphism in Java.' },
  { id: 12, course: 'CS103', co: 'CO2', description: 'Design robust applications using Java Exception Handling and Multithreading.' },
  { id: 13, course: 'CS103', co: 'CO3', description: 'Implement GUI components and event handling with Swing / JavaFX.' },

  { id: 14, course: 'CS201', co: 'CO1', description: 'Explain operating system architecture, kernel services, and process management.' },
  { id: 15, course: 'CS201', co: 'CO2', description: 'Analyze CPU scheduling algorithms and process synchronization mechanisms.' },
  { id: 16, course: 'CS201', co: 'CO3', description: 'Resolve deadlocks using Banker\'s Algorithm and evaluate virtual memory paging.' },

  { id: 17, course: 'CS301', co: 'CO1', description: 'Understand OSI and TCP/IP protocol architectures and layered networking.' },
  { id: 18, course: 'CS301', co: 'CO2', description: 'Calculate IP addressing, subnet masks, and configure network routing protocols.' },
  { id: 19, course: 'CS301', co: 'CO3', description: 'Analyze transport layer flow control (TCP sliding window) and congestion management.' },

  { id: 20, course: 'CS302', co: 'CO1', description: 'Contrast traditional SDLC models with Agile Scrum sprint workflows.' },
  { id: 21, course: 'CS302', co: 'CO2', description: 'Draft Software Requirement Specifications (SRS) and UML system architecture diagrams.' },
  { id: 22, course: 'CS302', co: 'CO3', description: 'Execute automated unit testing, integration testing, and code coverage metrics.' },

  // 2. IT (Information Technology)
  { id: 23, course: 'IT113', co: 'CO1', description: 'Formulate algorithmic problem solutions and flowchart representations in C.' },
  { id: 24, course: 'IT113', co: 'CO2', description: 'Implement modular programs using functions, pointers, and memory allocation.' },
  { id: 25, course: 'IT113', co: 'CO3', description: 'Process structured records and file handling streams in C programming.' },

  { id: 26, course: 'IT201', co: 'CO1', description: 'Implement object-oriented data structures using C++ templates and classes.' },
  { id: 27, course: 'IT201', co: 'CO2', description: 'Construct linear and hierarchical data representation models.' },
  { id: 28, course: 'IT201', co: 'CO3', description: 'Apply sorting, searching, and hashing algorithms for large datasets.' },

  { id: 29, course: 'IT211', co: 'CO1', description: 'Explain Linux kernel architecture, shell scripting, and system administration.' },
  { id: 30, course: 'IT211', co: 'CO2', description: 'Manage process scheduling, user permissions, and daemon configurations.' },
  { id: 31, course: 'IT211', co: 'CO3', description: 'Configure network services, firewall rules, and virtualized container environments.' },

  { id: 32, course: 'IT301', co: 'CO1', description: 'Design computer communication network topologies and packet switched routing.' },
  { id: 33, course: 'IT301', co: 'CO2', description: 'Implement socket programming and application layer client-server protocols.' },

  { id: 34, course: 'IT305', co: 'CO1', description: 'Develop dynamic responsive web applications using modern web frameworks.' },
  { id: 35, course: 'IT305', co: 'CO2', description: 'Build RESTful API services connected to relational database persistence engines.' },

  // 3. ECE (Electronics & Communication Engineering)
  { id: 36, course: 'EC114', co: 'CO1', description: 'Analyze DC and AC electric circuits using Kirchhoff\'s Laws and network theorems.' },
  { id: 37, course: 'EC114', co: 'CO2', description: 'Explain operational principles of semiconductor diodes, BJTs, and MOSFETs.' },
  { id: 38, course: 'EC114', co: 'CO3', description: 'Understand basic digital logic gates, flip-flops, and binary number systems.' },

  { id: 39, course: 'EC201', co: 'CO1', description: 'Analyze semiconductor band theory, carrier transport, and PN junction characteristics.' },
  { id: 40, course: 'EC201', co: 'CO2', description: 'Model BJT and FET transistor small-signal amplifier configurations.' },
  { id: 41, course: 'EC201', co: 'CO3', description: 'Evaluate frequency response and feedback amplifier stability criteria.' },

  { id: 42, course: 'EC202', co: 'CO1', description: 'Design combinational logic circuits using Boolean minimization and K-maps.' },
  { id: 43, course: 'EC202', co: 'CO2', description: 'Synthesize synchronous sequential circuits, finite state machines, and counters.' },
  { id: 44, course: 'EC202', co: 'CO3', description: 'Implement digital hardware systems using Verilog HDL and FPGA targets.' },

  { id: 45, course: 'EC211', co: 'CO1', description: 'Analyze operational amplifier circuits: differential amplifiers, filters, and oscillators.' },
  { id: 46, course: 'EC211', co: 'CO2', description: 'Design linear and non-linear analog signal processing modules.' },

  { id: 47, course: 'EC301', co: 'CO1', description: 'Evaluate continuous-time and discrete-time signals using Fourier and Z-transforms.' },
  { id: 48, course: 'EC301', co: 'CO2', description: 'Characterize LTI system impulse response, stability, and convolution properties.' },

  // 4. ME (Mechanical Engineering)
  { id: 49, course: 'ME113', co: 'CO1', description: 'Apply principles of statics, free-body diagrams, and equilibrium conditions.' },
  { id: 50, course: 'ME113', co: 'CO2', description: 'Calculate centroids, moments of inertia, and frictional forces in mechanisms.' },
  { id: 51, course: 'ME113', co: 'CO3', description: 'Analyze internal forces in pin-jointed trusses and structural frames.' },

  { id: 52, course: 'ME201', co: 'CO1', description: 'Apply First and Second Laws of Thermodynamics to closed and open engineering systems.' },
  { id: 53, course: 'ME201', co: 'CO2', description: 'Evaluate entropy generation, exergy availability, and thermodynamic property relations.' },
  { id: 54, course: 'ME201', co: 'CO3', description: 'Analyze ideal gas power cycles (Otto, Diesel, Dual, and Brayton cycles).' },

  { id: 55, course: 'ME202', co: 'CO1', description: 'Evaluate axial, shearing, and torsional stresses in structural mechanical members.' },
  { id: 56, course: 'ME202', co: 'CO2', description: 'Construct Shear Force and Bending Moment diagrams for loaded beam structures.' },
  { id: 57, course: 'ME202', co: 'CO3', description: 'Calculate principal stresses, Mohr\'s Circle transformations, and failure theories.' },

  { id: 58, course: 'ME211', co: 'CO1', description: 'Analyze vapor power cycles (Rankine cycle, reheat, and regenerative feed heating).' },
  { id: 59, course: 'ME211', co: 'CO2', description: 'Evaluate steam generator boiler efficiencies, nozzles, and turbine expansions.' },

  { id: 60, course: 'ME301', co: 'CO1', description: 'Apply Navier-Stokes and boundary layer equations to internal/external fluid flows.' },
  { id: 61, course: 'ME301', co: 'CO2', description: 'Design centrifugal pumps, Pelton wheels, and Francis hydraulic turbo-machinery.' },

  // 5. Civil (Civil Engineering)
  { id: 62, course: 'CE113', co: 'CO1', description: 'Formulate 2D and 3D equilibrium equations for rigid bodies and spatial concurrent force systems.' },
  { id: 63, course: 'CE113', co: 'CO2', description: 'Calculate center of gravity, area moment of inertia, and mass moment of inertia.' },
  { id: 64, course: 'CE113', co: 'CO3', description: 'Determine internal axial forces in plane trusses using method of joints and sections.' },

  { id: 65, course: 'CE201', co: 'CO1', description: 'Analyze stress, strain, elasticity moduli, and thermal deformation in engineering materials.' },
  { id: 66, course: 'CE201', co: 'CO2', description: 'Construct SFD and BMD for determinate beams under concentrated and distributed loads.' },
  { id: 67, course: 'CE201', co: 'CO3', description: 'Derive bending stress distributions, transverse shear stresses, and column buckling loads.' },

  { id: 68, course: 'CE202', co: 'CO1', description: 'Execute distance and angular measurements using chain, compass, and theodolite surveying.' },
  { id: 69, course: 'CE202', co: 'CO2', description: 'Perform leveling, contour plotting, profile computation, and earthwork volume calculation.' },
  { id: 70, course: 'CE202', co: 'CO3', description: 'Apply Total Station, GPS, and GIS digital mapping technologies in field layout.' },

  { id: 71, course: 'CE203', co: 'CO1', description: 'Calculate hydrostatic pressure distributions on submerged planar and curved surfaces.' },
  { id: 72, course: 'CE203', co: 'CO2', description: 'Apply continuity, momentum, and Bernoulli energy equations to pipe flow systems.' },
  { id: 73, course: 'CE203', co: 'CO3', description: 'Evaluate laminar and turbulent pipe friction losses, hydraulic grade lines, and open channels.' },

  { id: 74, course: 'CE301', co: 'CO1', description: 'Analyze indeterminate trusses, beams, and rigid frames using slope-deflection & moment distribution methods.' },
  { id: 75, course: 'CE301', co: 'CO2', description: 'Calculate influence line diagrams for moving live loads on bridge structures.' }
];

export const DEFAULT_INITIAL_MAPPINGS: CoMapping[] = [
  // CSE Mappings
  { id: 1, course: 'CS101', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 2, course: 'CS101', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 3, course: 'CS101', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 4, course: 'CS101', co: 'CO4', po: 'PO5', contribution: 60, mappingLevel: 2, status: 'Approved' },
  { id: 5, course: 'CS101', co: 'CO5', po: 'PO12', contribution: 60, mappingLevel: 2, status: 'Approved' },
  
  { id: 6, course: 'CS102', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 7, course: 'CS102', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 8, course: 'CS102', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 9, course: 'CS102', co: 'CO4', po: 'PO4', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 10, course: 'CS102', co: 'CO5', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 11, course: 'CS103', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 12, course: 'CS103', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 13, course: 'CS103', co: 'CO3', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 14, course: 'CS201', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 15, course: 'CS201', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 16, course: 'CS201', co: 'CO3', po: 'PO4', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 17, course: 'CS301', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 18, course: 'CS301', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 19, course: 'CS301', co: 'CO3', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },

  // IT Mappings
  { id: 20, course: 'IT113', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 21, course: 'IT113', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 22, course: 'IT113', co: 'CO3', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 23, course: 'IT201', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 24, course: 'IT201', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 25, course: 'IT201', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 26, course: 'IT211', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 27, course: 'IT211', co: 'CO2', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 28, course: 'IT211', co: 'CO3', po: 'PO12', contribution: 60, mappingLevel: 2, status: 'Approved' },

  { id: 29, course: 'IT301', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 30, course: 'IT301', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  // ECE Mappings
  { id: 31, course: 'EC114', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 32, course: 'EC114', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 33, course: 'EC114', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 34, course: 'EC201', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 35, course: 'EC201', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 36, course: 'EC201', co: 'CO3', po: 'PO4', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 37, course: 'EC202', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 38, course: 'EC202', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 39, course: 'EC202', co: 'CO3', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 40, course: 'EC211', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 41, course: 'EC211', co: 'CO2', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  // ME Mappings
  { id: 42, course: 'ME113', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 43, course: 'ME113', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 44, course: 'ME113', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 45, course: 'ME201', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 46, course: 'ME201', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 47, course: 'ME201', co: 'CO3', po: 'PO7', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 48, course: 'ME202', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 49, course: 'ME202', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 50, course: 'ME202', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 51, course: 'ME211', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 52, course: 'ME211', co: 'CO2', po: 'PO7', contribution: 90, mappingLevel: 3, status: 'Approved' },

  // Civil Mappings
  { id: 53, course: 'CE113', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 54, course: 'CE113', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 55, course: 'CE113', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 56, course: 'CE201', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 57, course: 'CE201', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 58, course: 'CE201', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' },

  { id: 59, course: 'CE202', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 60, course: 'CE202', co: 'CO2', po: 'PO5', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 61, course: 'CE202', co: 'CO3', po: 'PO11', contribution: 60, mappingLevel: 2, status: 'Approved' },

  { id: 62, course: 'CE203', co: 'CO1', po: 'PO1', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 63, course: 'CE203', co: 'CO2', po: 'PO2', contribution: 90, mappingLevel: 3, status: 'Approved' },
  { id: 64, course: 'CE203', co: 'CO3', po: 'PO3', contribution: 90, mappingLevel: 3, status: 'Approved' }
];

@Component({
  selector: 'app-copo-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './copo-mapping.html',
  styleUrls: ['./copo-mapping.css']
})
export class CopoMapping implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private navService = inject(NavigationService);

  goBack(): void {
    if ((this as any).showEditModal) {
      (this as any).closeModal();
      return;
    }
    this.navService.goBack();
  }

  role: string | null = null;

  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';

  appearance = {
    theme: 'dark',
    colorScheme: 'gold',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  isApproved = (m: CoMapping): boolean => m && m.status === 'Approved';

  themeStyles: { [key: string]: string } = {};

  studentNavGroups = [
    {
      title: 'ACADEMICS',
      items: [
        { label: 'Student Dashboard', path: '/students', icon: 'dashboard' },
        { label: 'Enrolled Courses', path: '/courses', icon: 'menu_book' },
        { label: 'Subject List', path: '/subjects', icon: 'subject' },
        { label: 'Weekly Timetable', path: '/timetable', icon: 'calendar_month' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: 'track_changes' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: 'military_tech' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: 'hub' },
        { label: 'CO Attainment', path: '/co-attainment', icon: 'stacked_bar_chart' },
        { label: 'PO Attainment', path: '/po-attainment', icon: 'trending_up' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: 'quiz' },
        { label: 'Attendance %', path: '/attendance', icon: 'fact_check' },
        { label: 'Marks Summary', path: '/performance', icon: 'assessment' },
        { label: 'Semester Results', path: '/results', icon: 'rate_review' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: 'rate_review' },
        { label: 'File Grievance', path: '/grievance', icon: 'assignment' },
        { label: 'Notifications', path: '/notifications', icon: 'notifications' },
        { label: 'Student Details', path: '/profile', icon: 'manage_accounts' }
      ]
    }
  ];

  programOutcomes: ProgramOutcome[] = [...DEFAULT_PROGRAM_OUTCOMES];
  courseOutcomes: CourseOutcome[] = [...DEFAULT_INITIAL_COS];
  courses: string[] = DEFAULT_DATABASE_COURSES.map(c => c.code);
  selectedCourseOutcomeKey = '';

  newPoNumber = '';
  newPoDescription = '';
  newCoCourse = '';
  newCoCode = '';
  newCoDescription = '';

  selectedBranch: string = 'ALL';

  get studentAllowedCourses(): string[] {
    if (this.role === 'admin' || this.selectedBranch === 'ALL') {
      return [];
    }

    if (this.role === 'faculty') {
      const assigned: string[] = [];
      try {
        const storedAssigned = JSON.parse(localStorage.getItem('userAssignedCourses') || '[]');
        if (Array.isArray(storedAssigned) && storedAssigned.length > 0) {
          storedAssigned.forEach(a => assigned.push(a));
        }
      } catch {}
      if (assigned.length > 0) return assigned;

      const branch = this.currentActiveBranch;
      if (branch === 'CSE') return ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302', 'CS401'];
      if (branch === 'IT') return ['IT111', 'IT201', 'IT202', 'IT301', 'IT311', 'IT401'];
      if (branch === 'ECE') return ['EC111', 'EC201', 'EC202', 'EC301', 'EC303', 'EC401'];
      if (branch === 'ME') return ['ME111', 'ME201', 'ME202', 'ME301', 'ME311', 'ME401'];
      if (branch === 'Civil') return ['CE111', 'CE201', 'CE202', 'CE301', 'CE311', 'CE401'];
      return ['CS101', 'CS102', 'CS103'];
    }

    if (this.role === 'student') {
      return ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302', 'CS303', 'CS401', 'CS402'];
    }

    return [];
  }

  get currentActiveBranch(): string {
    if (this.role === 'admin') return 'ALL';
    const d = (this.studentDept || '').toLowerCase();
    if (d.includes('computer') || d.includes('cse') || d.includes('cs')) return 'CSE';
    if (d.includes('information') || d.includes('it')) return 'IT';
    if (d.includes('electronic') || d.includes('ece') || d.includes('electrical') || d.includes('eee') || d === 'ee') return 'ECE';
    if (d.includes('mechanical') || d.includes('mech')) return 'ME';
    if (d.includes('civil') || d === 'ce') return 'Civil';
    return 'CSE';
  }

  get filteredGroupedMappings() {
    if (this.selectedBranch === 'ALL') {
      return this.groupedMappings;
    }

    const branch = (this.selectedBranch === 'MY_BRANCH' ? this.currentActiveBranch : this.selectedBranch).toUpperCase();
    
    return this.groupedMappings.filter(g => {
      const gName = g.courseName.toUpperCase();
      if (branch === 'CSE') return gName.includes('CS') || gName.includes('COMPUTER') || gName.includes('DATA');
      if (branch === 'IT') return gName.includes('IT') || gName.includes('INFORMATION');
      if (branch === 'ECE') return gName.includes('EC') || gName.includes('EE') || gName.includes('ELECTRONIC');
      if (branch === 'MECHANICAL' || branch === 'ME') return gName.includes('ME') || gName.includes('MECHANICAL') || gName.includes('THERMAL');
      if (branch === 'CIVIL' || branch === 'CE') return gName.includes('CE') || gName.includes('CIVIL') || gName.includes('SURVEY');
      return true;
    });
  }

  get filteredCourseOutcomes() {
    if (this.selectedBranch === 'ALL') {
      return this.courseOutcomes;
    }

    const branch = (this.selectedBranch === 'MY_BRANCH' ? this.currentActiveBranch : this.selectedBranch).toUpperCase();

    return this.courseOutcomes.filter(co => {
      const c = (co.course || '').toUpperCase();
      if (branch === 'CSE') return c.startsWith('CS') || c.includes('COMPUTER') || c.includes('DATA');
      if (branch === 'IT') return c.startsWith('IT') || c.includes('INFORMATION');
      if (branch === 'ECE') return c.startsWith('EC') || c.startsWith('EE') || c.includes('ELECTRONIC');
      if (branch === 'MECHANICAL' || branch === 'ME') return c.startsWith('ME') || c.includes('MECHANICAL');
      if (branch === 'CIVIL' || branch === 'CE') return c.startsWith('CE') || c.includes('CIVIL');
      return true;
    });
  }

  get totalFilteredMappings(): number {
    return this.filteredGroupedMappings.reduce((sum, g) => sum + g.mappings.length, 0);
  }

  get totalApprovedMappings(): number {
    return this.filteredGroupedMappings.reduce((sum, g) => sum + g.mappings.filter(this.isApproved).length, 0);
  }

  matrixSelectedCourse: string = 'ALL';

  get uniqueMatrixPos(): ProgramOutcome[] {
    const seen = new Set<string>();
    return this.programOutcomes.filter(po => {
      const code = (po.poNumber || '').trim().toUpperCase();
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    });
  }

  get matrixCourseList(): string[] {
    const seen = new Set<string>();
    const list: string[] = [];
    this.filteredCourseOutcomes.forEach(co => {
      if (co.course && !seen.has(co.course)) {
        seen.add(co.course);
        list.push(co.course);
      }
    });
    return list;
  }

  get matrixCourseOutcomes(): CourseOutcome[] {
    let list = this.filteredCourseOutcomes;
    if (this.matrixSelectedCourse && this.matrixSelectedCourse !== 'ALL') {
      list = list.filter(co => 
        (co.course || '').toLowerCase() === this.matrixSelectedCourse.toLowerCase() ||
        (co.course || '').toLowerCase().includes(this.matrixSelectedCourse.toLowerCase()) ||
        this.matrixSelectedCourse.toLowerCase().includes((co.course || '').toLowerCase())
      );
    }
    return list;
  }

  mappingLevels = [
    { value: 1, label: '1 - Low (Slight focus <30%)' },
    { value: 2, label: '2 - Medium (Moderate focus 30-60%)' },
    { value: 3, label: '3 - High (Substantial focus >60%)' }
  ];

  showMatrix = true;
  mappings: CoMapping[] = [...DEFAULT_INITIAL_MAPPINGS];
  groupedMappings: Array<{ courseName: string; mappings: CoMapping[] }> = [];
  collapsedGroups: { [courseName: string]: boolean } = {};

  currentMapping: CoMapping = { id: 0, course: '', co: '', po: '', contribution: 0, mappingLevel: 0, status: 'Pending' };
  editIndex = -1;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.studentName = localStorage.getItem('userName') || 'Admin';
      this.studentEmail = localStorage.getItem('userEmail') || 'admin@centurionuniv.edu.in';
      this.studentPhoto = localStorage.getItem('userProfilePicture') || null;
      this.studentDept = localStorage.getItem('userDepartment') || 'Administration';
      this.studentRoll = localStorage.getItem('userRoll') || 'ADMIN001';

      if (this.role === 'admin') {
        this.selectedBranch = 'ALL';
      } else if (this.role === 'faculty') {
        this.selectedBranch = 'MY_BRANCH';
      } else {
        this.selectedBranch = 'CSE';
      }
    } catch {
      this.role = null;
    }
    this.groupMappings();
    this.loadAppearance();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCourses();
    this.resetMapping();
  }

  loadData() {
    this.loadProgramOutcomes();
    this.loadCourseOutcomes();
    this.loadMappings();
  }

  private loadProgramOutcomes() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/po?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/po';

    this.http.get<ProgramOutcome[]>(url).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.programOutcomes = data;
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private loadCourseOutcomes() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/co?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/co';

    this.http.get<CourseOutcome[]>(url).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          let list = data;
          if (this.role === 'faculty') {
            let assigned: string[] = [];
            try {
              const stored = localStorage.getItem('userAssignedCourses');
              if (stored) assigned = JSON.parse(stored);
            } catch {}
            if (assigned.length > 0) {
              list = data.filter(item => 
                assigned.includes(item.course) || 
                assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
              );
            }
          }
          this.courseOutcomes = list;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private loadMappings() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/mappings?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/mappings';

    this.http.get<CoMapping[]>(url).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          let list = data;
          if (this.role === 'faculty') {
            let assigned: string[] = [];
            try {
              const stored = localStorage.getItem('userAssignedCourses');
              if (stored) assigned = JSON.parse(stored);
            } catch {}
            if (assigned.length > 0) {
              list = data.filter(item => 
                assigned.includes(item.course) || 
                assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
              );
            }
          }
          this.mappings = list;
          this.groupMappings();
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private saveMappings() {}

  private safeLoadJson<T>(key: string): T[] {
    return [];
  }

  private uniqueBy<T>(items: T[], selector: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = selector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  saveMapping() {
    if (this.role === 'student') {
      this.toast.warning('Only admins and faculty can manage CO-PO mappings.');
      return;
    }

    if (!this.currentMapping.co || !this.currentMapping.po || this.currentMapping.contribution <= 0 || this.currentMapping.mappingLevel <= 0) {
      this.toast.warning('Please select both CO and PO and enter valid mapping details.');
      return;
    }

    const payload = {
      id: this.currentMapping.id > 0 ? this.currentMapping.id : null,
      course: this.currentMapping.course,
      co: this.currentMapping.co,
      po: this.currentMapping.po,
      contribution: this.currentMapping.contribution,
      mappingLevel: this.currentMapping.mappingLevel,
      status: this.currentMapping.status
    };

    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', payload).subscribe({
      next: () => {
        this.loadMappings();
        this.resetMapping();
        this.toast.success('CO-PO mapping saved successfully.');
      },
      error: () => {
        this.toast.error('Failed to save mapping.');
      }
    });
  }

  editMapping(index: number) {
    if (this.role === 'student') {
      this.toast.warning('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    this.editIndex = index;
    this.currentMapping = { ...this.mappings[index] };
    this.selectedCourseOutcomeKey = `${this.currentMapping.course}::${this.currentMapping.co}`;
  }

  approveMapping(index: number) {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can approve mappings.');
      return;
    }
    const mapping = { ...this.mappings[index] };
    mapping.status = 'Approved';
    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', mapping).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.success('Mapping approved successfully.');
      },
      error: () => {
        this.toast.error('Failed to approve mapping.');
      }
    });
  }

  toggleMappingView() {
    this.showMatrix = !this.showMatrix;
  }

  deleteMapping(index: number) {
    if (this.role === 'student') {
      this.toast.warning('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    const target = this.mappings[index];
    this.http.delete('http://localhost:8080/api/copo/mappings/' + target.id).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.info('Mapping removed.');
        if (this.editIndex === index) {
          this.resetMapping();
        }
      },
      error: () => {
        this.toast.error('Failed to delete mapping.');
      }
    });
  }

  onCoChange(selectionKey: string) {
    const [course, co] = selectionKey.split('::');
    this.currentMapping.co = co || '';
    this.currentMapping.course = course || '';
  }

  getCourseOutcomeDescription(course: string, co: string): string {
    return this.courseOutcomes.find(item => item.course === course && item.co === co)?.description || '';
  }

  getProgramOutcomeDescription(poNumber: string): string {
    return this.programOutcomes.find(item => item.poNumber === poNumber)?.description || '';
  }

  addProgramOutcome() {
    if (this.role === 'student') {
      this.toast.warning('Only admins and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.newPoDescription.trim()) {
      this.toast.warning('Enter a PO description.');
      return;
    }

    const index = this.programOutcomes.filter(po => po.poNumber.startsWith('PO')).length + 1;
    const poNumber = this.newPoNumber.trim() || `PO${index}`;

    if (this.programOutcomes.some(po => po.poNumber === poNumber)) {
      this.toast.error('This PO already exists.');
      return;
    }

    const payload = {
      id: null,
      poNumber: poNumber,
      description: this.newPoDescription.trim()
    };

    this.http.post<ProgramOutcome>('http://localhost:8080/api/copo/po', payload).subscribe({
      next: () => {
        this.loadProgramOutcomes();
        this.toast.success(`Program Outcome ${poNumber} added.`);
        this.resetPoForm();
      },
      error: () => {
        this.toast.error('Failed to add PO.');
      }
    });
  }

  addCourseOutcome() {
    if (this.role === 'student') {
      this.toast.warning('Only admins and faculty can manage Course Outcomes.');
      return;
    }

    if (!this.newCoCourse.trim()) {
      this.toast.warning('Enter the course for this CO.');
      return;
    }

    const nextCoIndex = this.courseOutcomes.filter(item => item.course === this.newCoCourse.trim()).length + 1;
    const coCode = this.newCoCode.trim() || `CO${nextCoIndex}`;

    if (this.courseOutcomes.some(item => item.course === this.newCoCourse.trim() && item.co === coCode)) {
      this.toast.error('This course outcome already exists.');
      return;
    }

    const payload = {
      id: null,
      course: this.newCoCourse.trim(),
      co: coCode,
      description: this.newCoDescription.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: () => {
        this.loadCourseOutcomes();
        this.toast.success(`Course Outcome ${coCode} created.`);
        this.resetCoForm();
      },
      error: () => {
        this.toast.error('Failed to create CO.');
      }
    });
  }

  private saveProgramOutcomes() {}

  private saveCourseOutcomes() {}

  private loadCourses() {
    this.http.get<Array<{ code: string; title: string }>>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(c => 
              assigned.includes(c.title) || 
              assigned.includes(c.code)
            );
          }
        }
        this.courses = list.map(c => c.code).filter(Boolean);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = [];
      }
    });
  }

  resetPoForm() {
    this.newPoNumber = '';
    this.newPoDescription = '';
  }

  resetCoForm() {
    this.newCoCourse = '';
    this.newCoCode = '';
    this.newCoDescription = '';
  }

  courseFullNameMap: { [key: string]: string } = {
    'CS101': 'CS101 - Database Management Systems',
    'CS102': 'CS102 - Data Structures & Algorithms',
    'CS103': 'CS103 - Object-Oriented Programming with Java',
    'CS201': 'CS201 - Operating Systems',
    'CS202': 'CS202 - Machine Learning & Data Science',
    'CS301': 'CS301 - Computer Networks & Protocols',
    'CS302': 'CS302 - Software Engineering & Agile Methodology',
    'CS303': 'CS303 - Cloud Computing & DevOps',
    'CS401': 'CS401 - Artificial Intelligence',
    'CS402': 'CS402 - Cyber Security & Cryptography',
    'IT111': 'IT111 - Calculus & Linear Algebra',
    'IT201': 'IT201 - Data Structures & Algorithms',
    'IT301': 'IT301 - Database Management Systems',
    'EC111': 'EC111 - Linear Algebra & Transform Calculus',
    'EC201': 'EC201 - Electronic Devices and Circuit Theory',
    'EE111': 'EE111 - Calculus & Differential Equations',
    'EE201': 'EE201 - Electric Circuit Analysis',
    'ME111': 'ME111 - Calculus & Linear Algebra',
    'ME201': 'ME201 - Engineering Thermodynamics',
    'CE111': 'CE111 - Calculus & Linear Algebra',
    'CE201': 'CE201 - Strength of Materials I'
  };

  getFullCourseName(courseStr: string): string {
    if (!courseStr) return '';
    const trimmed = courseStr.trim();
    if (this.courseFullNameMap[trimmed]) return this.courseFullNameMap[trimmed];
    
    for (const [k, v] of Object.entries(this.courseFullNameMap)) {
      if (trimmed.toLowerCase() === k.toLowerCase() || trimmed.toLowerCase().startsWith(k.toLowerCase())) {
        return v;
      }
    }
    const found = this.courses.find(c => c.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;

    return trimmed;
  }

  getMappingLevelLabel(level: number): string {
    return this.mappingLevels.find(item => item.value === level)?.label ?? 'Unknown';
  }

  getMatrixLevel(course: string, co: string, po: string): number | undefined {
    return this.mappings.find(mapping => mapping.course === course && mapping.co === co && mapping.po === po)?.mappingLevel;
  }

  exportMatrixCsv(): void {
    if (this.uniqueMatrixPos.length === 0 || this.matrixCourseOutcomes.length === 0) {
      this.toast.warning('No matrix data available to export.');
      return;
    }
    const headers = ['Course - CO', ...this.uniqueMatrixPos.map(po => po.poNumber)];
    const rows = this.matrixCourseOutcomes.map(outcome => {
      const row = [`"${outcome.course} - ${outcome.co}"`];
      this.uniqueMatrixPos.forEach(po => {
        const level = this.getMatrixLevel(outcome.course, outcome.co, po.poNumber);
        row.push(level !== undefined ? `"${level}"` : '""');
      });
      return row.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CO_PO_Mapping_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('CO-PO Matrix exported to CSV.');
  }

  downloadNBAPdfReport(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toast.error('Popup blocked. Please allow popups to download NBA PDF report.');
      return;
    }

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dept = this.studentDept || 'Computer Science & Engineering';

    let tableRows = '';
    this.filteredGroupedMappings.forEach(grp => {
      grp.mappings.forEach(m => {
        tableRows += `
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 11px;">${grp.courseName}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #1e40af;">${m.co}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #047857;">${m.po}</td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; ${
                m.mappingLevel === 3 ? 'background: #dcfce7; color: #166534;' : 
                m.mappingLevel === 2 ? 'background: #fef9c3; color: #854d0e;' : 
                'background: #fee2e2; color: #991b1b;'
              }">
                Level ${m.mappingLevel || m.contribution || 1} (${m.mappingLevel === 3 ? 'High' : m.mappingLevel === 2 ? 'Medium' : 'Low'})
              </span>
            </td>
            <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center; color: #15803d; font-weight: bold;">Approved</td>
          </tr>
        `;
      });
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NBA Accreditation CO-PO Articulation Dossier</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
          .inst-title { font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; }
          .sub-title { font-size: 13px; color: #475569; margin: 4px 0 0 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #1e40af; color: #ffffff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; border: 1px solid #1e40af; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
          .sig-box { text-align: center; width: 200px; border-top: 1px solid #475569; padding-top: 8px; font-size: 12px; font-weight: bold; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="inst-title">CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT</h1>
          <p class="sub-title">DEPARTMENT OF ${dept.toUpperCase()} | OUTCOME-BASED EDUCATION (OBE) CELL</p>
          <p style="font-size: 15px; font-weight: 800; color: #0f766e; margin: 8px 0 0 0;">NBA CRITERIA-3: OFFICIAL CO-PO ARTICULATION MATRIX REPORT</p>
        </div>

        <div class="meta-grid">
          <div><strong>Academic Year:</strong> 2025 - 2026 (Odd Semester)</div>
          <div><strong>Accreditation Tier:</strong> NBA Tier-1 Compliant</div>
          <div><strong>Department:</strong> ${dept}</div>
          <div><strong>Generated On:</strong> ${today}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Course Name / Code</th>
              <th>Course Outcome</th>
              <th>Program Outcome</th>
              <th>Correlation Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; font-size: 11px; margin-bottom: 30px;">
          <strong>NBA Mapping Key:</strong> Level 1 (Slight/Low: 10-25%), Level 2 (Moderate/Medium: 25-50%), Level 3 (Substantial/High: >50%).
        </div>

        <div class="signatures">
          <div class="sig-box">Course Coordinator</div>
          <div class="sig-box">OBE & NBA Coordinator</div>
          <div class="sig-box">Head of Department (HOD)</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
    this.toast.success('Generated official NBA CO-PO Articulation PDF report.');
  }

  printMatrix(): void {
    this.downloadNBAPdfReport();
  }

  getCourseFullName(courseCode: string): string {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const storedCourses = stored ? JSON.parse(stored) : [];
      const found = storedCourses.find((c: any) => 
        c.code?.toLowerCase() === courseCode?.toLowerCase() || 
        c.title?.toLowerCase() === courseCode?.toLowerCase()
      );
      return found ? `${found.code} - ${found.title}` : courseCode;
    } catch {
      return courseCode;
    }
  }

  groupMappings() {
    const groups = new Map<string, CoMapping[]>();
    this.mappings.forEach(m => {
      const rawName = m.course || 'General';
      const cName = this.getCourseFullName(rawName);
      if (!groups.has(cName)) {
        groups.set(cName, []);
      }
      groups.get(cName)!.push(m);
    });
    this.groupedMappings = Array.from(groups.keys()).map(cName => ({
      courseName: cName,
      mappings: groups.get(cName)!
    }));
  }

  toggleGroup(courseName: string) {
    this.collapsedGroups[courseName] = !this.collapsedGroups[courseName];
  }

  resetMapping() {
    this.editIndex = -1;
    this.selectedCourseOutcomeKey = '';
    this.currentMapping = {
      id: 0,
      course: '',
      co: '',
      po: '',
      contribution: 0,
      mappingLevel: 0,
      status: 'Pending'
    };
  }

  loadAppearance(): void {
    try {
      const stored = localStorage.getItem('oblmsAppearance');
      if (stored) {
        this.appearance = JSON.parse(stored);
      }
    } catch {}
    this.applyThemeStyleMapping();
  }

  private applyThemeStyleMapping(): void {
    const isDark = this.appearance.theme === 'dark' || 
      (this.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    let primary = '#1976d2';
    let primaryRgb = '25, 118, 210';
    let heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';

    switch (this.appearance.colorScheme) {
      case 'purple':
        primary = '#8b5cf6';
        primaryRgb = '139, 92, 246';
        heroBg = 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)';
        break;
      case 'green':
        primary = '#10b981';
        primaryRgb = '16, 185, 129';
        heroBg = 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)';
        break;
      case 'red':
        primary = '#ef4444';
        primaryRgb = '239, 68, 68';
        heroBg = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #ef4444 100%)';
        break;
      case 'orange':
        primary = '#f97316';
        primaryRgb = '249, 115, 22';
        heroBg = 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #f97316 100%)';
        break;
      default:
        primary = '#1976d2';
        primaryRgb = '25, 118, 210';
        heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
    }

    this.themeStyles = {
      '--student-primary': primary,
      '--student-primary-rgb': primaryRgb,
      '--student-hero-bg': heroBg,
      '--student-bg': bg,
      '--student-card-bg': cardBg,
      '--student-text': text,
      '--student-text-secondary': textSecondary,
      '--student-border': border,
      '--student-sidebar-bg': sidebarBg
    };
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch {}
    this.router.navigate(['/login']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
