import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { DEFAULT_DATABASE_COURSES } from '../../shared/services/course.service';

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description: string;
}

export interface GroupedSubjectCOs {
  courseCode: string;
  courseTitle: string;
  fullCourseName: string;
  cos: CourseOutcome[];
  isExpanded: boolean;
}

export const MASTER_COURSE_OUTCOMES: { [code: string]: { co: string; desc: string }[] } = {
  'CS101': [
    { co: 'CO1', desc: 'Explain database architecture, schema design, and entity-relationship models.' },
    { co: 'CO2', desc: 'Formulate relational algebra queries and complex SQL queries.' },
    { co: 'CO3', desc: 'Apply normalization techniques (1NF to BCNF) to eliminate database redundancies.' },
    { co: 'CO4', desc: 'Implement transaction management and concurrency control protocols.' },
    { co: 'CO5', desc: 'Demonstrate indexing, hashing, and database tuning strategies.' }
  ],
  'CS102': [
    { co: 'CO1', desc: 'Analyze asymptotic time and space complexity of algorithms.' },
    { co: 'CO2', desc: 'Design linear data structures including linked lists, stacks, and queues.' },
    { co: 'CO3', desc: 'Implement non-linear data structures including binary trees, AVL trees, and heaps.' },
    { co: 'CO4', desc: 'Apply graph traversal algorithms (BFS, DFS) and shortest path algorithms.' },
    { co: 'CO5', desc: 'Evaluate searching, sorting, and hashing techniques for problem solving.' }
  ],
  'CS103': [
    { co: 'CO1', desc: 'Understand OOP concepts: encapsulation, inheritance, and polymorphism in Java.' },
    { co: 'CO2', desc: 'Design robust applications using Java Exception Handling and Multithreading.' },
    { co: 'CO3', desc: 'Implement GUI components and event handling with Swing / JavaFX.' },
    { co: 'CO4', desc: 'Integrate JDBC database connectivity with transaction management.' },
    { co: 'CO5', desc: 'Develop modular, object-oriented software applications.' }
  ],
  'CS201': [
    { co: 'CO1', desc: 'Explain operating system architecture, kernel services, and process management.' },
    { co: 'CO2', desc: 'Analyze CPU scheduling algorithms and process synchronization mechanisms.' },
    { co: 'CO3', desc: 'Resolve deadlocks using Banker\'s Algorithm and evaluate virtual memory paging.' },
    { co: 'CO4', desc: 'Evaluate file system implementations, disk scheduling, and I/O management.' },
    { co: 'CO5', desc: 'Implement multi-threaded systems programming in POSIX/Linux environment.' }
  ],
  'CS202': [
    { co: 'CO1', desc: 'Apply mathematical foundations of linear algebra, calculus, and probability to ML algorithms.' },
    { co: 'CO2', desc: 'Implement supervised learning algorithms including regression, SVM, and decision trees.' },
    { co: 'CO3', desc: 'Build unsupervised learning models for clustering, dimensionality reduction, and PCA.' },
    { co: 'CO4', desc: 'Train and evaluate deep neural networks with backpropagation and regularization.' },
    { co: 'CO5', desc: 'Deploy machine learning pipelines for predictive analytics and feature engineering.' }
  ],
  'CS301': [
    { co: 'CO1', desc: 'Understand OSI and TCP/IP protocol architectures and layered networking.' },
    { co: 'CO2', desc: 'Calculate IP addressing, subnet masks, and configure network routing protocols.' },
    { co: 'CO3', desc: 'Analyze transport layer flow control (TCP sliding window) and congestion management.' },
    { co: 'CO4', desc: 'Explain application layer protocols including HTTP, DNS, DHCP, and SMTP.' },
    { co: 'CO5', desc: 'Implement network socket programming and packet filtering firewalls.' }
  ],
  'CS302': [
    { co: 'CO1', desc: 'Contrast traditional SDLC models with Agile Scrum sprint workflows.' },
    { co: 'CO2', desc: 'Draft Software Requirement Specifications (SRS) and UML system architecture diagrams.' },
    { co: 'CO3', desc: 'Execute automated unit testing, integration testing, and code coverage metrics.' },
    { co: 'CO4', desc: 'Apply software design patterns, refactoring, and code review standards.' },
    { co: 'CO5', desc: 'Manage CI/CD deployment pipelines, version control, and project deliverables.' }
  ],
  'CS303': [
    { co: 'CO1', desc: 'Architect resilient cloud infrastructure using microservices and containerization (Docker, K8s).' },
    { co: 'CO2', desc: 'Implement infrastructure as code (IaC) and automated CI/CD deployment pipelines.' },
    { co: 'CO3', desc: 'Evaluate cloud security, IAM access policies, and virtual private clouds (VPC).' },
    { co: 'CO4', desc: 'Optimize cloud computing costs, autoscaling groups, and serverless compute functions.' },
    { co: 'CO5', desc: 'Deploy fault-tolerant distributed cloud backends with monitoring and observability.' }
  ],
  'CS401': [
    { co: 'CO1', desc: 'Formulate state-space search algorithms including A*, heuristic search, and game playing.' },
    { co: 'CO2', desc: 'Represent knowledge using first-order predicate logic, ontology, and inference engines.' },
    { co: 'CO3', desc: 'Construct probabilistic reasoning models using Bayesian networks and Markov chains.' },
    { co: 'CO4', desc: 'Design intelligent autonomous agents and reinforcement learning policy iterations.' },
    { co: 'CO5', desc: 'Evaluate ethical considerations and real-world deployment challenges in AI systems.' }
  ],
  'CS402': [
    { co: 'CO1', desc: 'Analyze symmetric and asymmetric cryptographic algorithms (AES, RSA, ECC).' },
    { co: 'CO2', desc: 'Implement cryptographic hash functions, digital signatures, and PKI certificates.' },
    { co: 'CO3', desc: 'Identify web and network vulnerabilities (SQLi, XSS, CSRF, buffer overflows).' },
    { co: 'CO4', desc: 'Design defense-in-depth network security architectures and intrusion detection systems.' },
    { co: 'CO5', desc: 'Conduct digital forensics investigations, incident response, and penetration testing.' }
  ],
  'IT113': [
    { co: 'CO1', desc: 'Formulate algorithmic problem solutions and flowchart representations in C.' },
    { co: 'CO2', desc: 'Implement modular programs using functions, pointers, and memory allocation.' },
    { co: 'CO3', desc: 'Process structured records and file handling streams in C programming.' },
    { co: 'CO4', desc: 'Analyze time-space algorithmic complexities and optimize execution efficiency.' },
    { co: 'CO5', desc: 'Develop robust, portable console utility applications in C.' }
  ],
  'IT201': [
    { co: 'CO1', desc: 'Implement object-oriented data structures using C++ templates and classes.' },
    { co: 'CO2', desc: 'Construct linear and hierarchical data representation models.' },
    { co: 'CO3', desc: 'Apply sorting, searching, and hashing algorithms for large datasets.' },
    { co: 'CO4', desc: 'Design graph algorithms and shortest path discovery pipelines.' },
    { co: 'CO5', desc: 'Evaluate spatial and temporal overheads of advanced data architectures.' }
  ],
  'IT211': [
    { co: 'CO1', desc: 'Explain Linux kernel architecture, shell scripting, and system administration.' },
    { co: 'CO2', desc: 'Manage process scheduling, user permissions, and daemon configurations.' },
    { co: 'CO3', desc: 'Configure network services, firewall rules, and virtualized container environments.' },
    { co: 'CO4', desc: 'Automate administrative maintenance with Bash shell scripting and cron jobs.' },
    { co: 'CO5', desc: 'Audit system security logs, user access privileges, and system resource limits.' }
  ],
  'IT301': [
    { co: 'CO1', desc: 'Design computer communication network topologies and packet switched routing.' },
    { co: 'CO2', desc: 'Implement socket programming and application layer client-server protocols.' },
    { co: 'CO3', desc: 'Analyze IP routing algorithms (OSPF, BGP) and subnetting strategies.' },
    { co: 'CO4', desc: 'Evaluate transport layer congestion control and reliable delivery mechanisms.' },
    { co: 'CO5', desc: 'Configure software-defined networks and secure VPN tunneling endpoints.' }
  ],
  'IT305': [
    { co: 'CO1', desc: 'Explain open source software licensing models, governance, and community workflows.' },
    { co: 'CO2', desc: 'Develop dynamic responsive web applications using modern open-source web frameworks.' },
    { co: 'CO3', desc: 'Build RESTful API services connected to relational database persistence engines.' },
    { co: 'CO4', desc: 'Manage distributed source control, code reviews, and CI/CD pipelines on GitHub/GitLab.' },
    { co: 'CO5', desc: 'Deploy containerized web applications on Linux-based open-source infrastructure.' }
  ],
  'EC114': [
    { co: 'CO1', desc: 'Analyze DC and AC electric circuits using Kirchhoff\'s Laws and network theorems.' },
    { co: 'CO2', desc: 'Explain operational principles of semiconductor diodes, BJTs, and MOSFETs.' },
    { co: 'CO3', desc: 'Understand basic digital logic gates, flip-flops, and binary number systems.' },
    { co: 'CO4', desc: 'Analyze steady-state AC circuit responses and sinusoidal power factors.' },
    { co: 'CO5', desc: 'Operate electronic test instruments: oscilloscopes, function generators, and multimeters.' }
  ],
  'EC201': [
    { co: 'CO1', desc: 'Analyze semiconductor band theory, carrier transport, and PN junction characteristics.' },
    { co: 'CO2', desc: 'Model BJT and FET transistor small-signal amplifier configurations.' },
    { co: 'CO3', desc: 'Evaluate frequency response and feedback amplifier stability criteria.' },
    { co: 'CO4', desc: 'Design operational amplifier analog signal conditioning circuits.' },
    { co: 'CO5', desc: 'Simulate analog circuit behavior using SPICE simulation suites.' }
  ],
  'EC202': [
    { co: 'CO1', desc: 'Design combinational logic circuits using Boolean minimization and K-maps.' },
    { co: 'CO2', desc: 'Synthesize synchronous sequential circuits, finite state machines, and counters.' },
    { co: 'CO3', desc: 'Implement digital hardware systems using Verilog HDL and FPGA targets.' },
    { co: 'CO4', desc: 'Analyze timing hazards, propagation delays, and clock skew in digital systems.' },
    { co: 'CO5', desc: 'Verify digital RTL architectures using testbenches and logic analyzers.' }
  ],
  'EC211': [
    { co: 'CO1', desc: 'Analyze operational amplifier circuits: differential amplifiers, filters, and oscillators.' },
    { co: 'CO2', desc: 'Design linear and non-linear analog signal processing modules.' },
    { co: 'CO3', desc: 'Evaluate comparator, Schmitt trigger, and waveform generator circuits.' },
    { co: 'CO4', desc: 'Synthesize active RC bandpass, lowpass, and highpass analog filters.' },
    { co: 'CO5', desc: 'Implement analog IC systems using precision voltage regulators and PLLs.' }
  ],
  'EC301': [
    { co: 'CO1', desc: 'Evaluate continuous-time and discrete-time signals using Fourier and Z-transforms.' },
    { co: 'CO2', desc: 'Characterize LTI system impulse response, stability, and convolution properties.' },
    { co: 'CO3', desc: 'Design digital FIR and IIR filters meeting attenuation and passband ripple specs.' },
    { co: 'CO4', desc: 'Implement Fast Fourier Transform (FFT) algorithms for spectral analysis.' },
    { co: 'CO5', desc: 'Apply digital signal processing techniques to audio, image, and RF telecommunication.' }
  ],
  'ME113': [
    { co: 'CO1', desc: 'Apply principles of statics, free-body diagrams, and equilibrium conditions.' },
    { co: 'CO2', desc: 'Calculate centroids, moments of inertia, and frictional forces in mechanisms.' },
    { co: 'CO3', desc: 'Analyze internal forces in pin-jointed trusses and structural frames.' },
    { co: 'CO4', desc: 'Formulate kinematics of particles and rigid bodies in rectilinear/curvilinear motion.' },
    { co: 'CO5', desc: 'Apply work-energy and impulse-momentum principles to dynamic mechanical systems.' }
  ],
  'ME201': [
    { co: 'CO1', desc: 'Apply First and Second Laws of Thermodynamics to closed and open engineering systems.' },
    { co: 'CO2', desc: 'Evaluate entropy generation, exergy availability, and thermodynamic property relations.' },
    { co: 'CO3', desc: 'Analyze ideal gas power cycles (Otto, Diesel, Dual, and Brayton cycles).' },
    { co: 'CO4', desc: 'Calculate coefficient of performance (COP) for refrigeration and heat pump cycles.' },
    { co: 'CO5', desc: 'Evaluate combustion stoichiometry, air-fuel ratios, and thermal boiler efficiencies.' }
  ],
  'ME202': [
    { co: 'CO1', desc: 'Evaluate axial, shearing, and torsional stresses in structural mechanical members.' },
    { co: 'CO2', desc: 'Construct Shear Force and Bending Moment diagrams for loaded beam structures.' },
    { co: 'CO3', desc: 'Calculate principal stresses, Mohr\'s Circle transformations, and failure theories.' },
    { co: 'CO4', desc: 'Determine beam deflection using double integration and Macaulay\'s methods.' },
    { co: 'CO5', desc: 'Analyze Euler buckling of columns and thin-walled pressure vessels.' }
  ],
  'ME211': [
    { co: 'CO1', desc: 'Analyze vapor power cycles (Rankine cycle, reheat, and regenerative feed heating).' },
    { co: 'CO2', desc: 'Evaluate steam generator boiler efficiencies, nozzles, and turbine expansions.' },
    { co: 'CO3', desc: 'Model steam condenser performance, cooling towers, and plant heat rates.' },
    { co: 'CO4', desc: 'Analyze gas turbine combined cycle (GTCC) and cogeneration thermodynamics.' },
    { co: 'CO5', desc: 'Design thermal power plant subsystems complying with environmental emission norms.' }
  ],
  'ME301': [
    { co: 'CO1', desc: 'Apply Navier-Stokes and boundary layer equations to internal/external fluid flows.' },
    { co: 'CO2', desc: 'Design centrifugal pumps, Pelton wheels, and Francis hydraulic turbo-machinery.' },
    { co: 'CO3', desc: 'Calculate minor and major frictional head losses in piping networks.' },
    { co: 'CO4', desc: 'Analyze dimensional homogeneity and Buckingham Pi theorem scaling models.' },
    { co: 'CO5', desc: 'Conduct aerodynamic drag and lift analysis over airfoils and submerged bodies.' }
  ],
  'CE113': [
    { co: 'CO1', desc: 'Formulate 2D and 3D equilibrium equations for rigid bodies and spatial concurrent force systems.' },
    { co: 'CO2', desc: 'Calculate center of gravity, area moment of inertia, and mass moment of inertia.' },
    { co: 'CO3', desc: 'Determine internal axial forces in plane trusses using method of joints and sections.' },
    { co: 'CO4', desc: 'Analyze static friction, belt friction, and wedge mechanisms.' },
    { co: 'CO5', desc: 'Apply virtual work principles to determine equilibrium configurations of structures.' }
  ],
  'CE201': [
    { co: 'CO1', desc: 'Analyze stress, strain, elasticity moduli, and thermal deformation in engineering materials.' },
    { co: 'CO2', desc: 'Construct SFD and BMD for determinate beams under concentrated and distributed loads.' },
    { co: 'CO3', desc: 'Derive bending stress distributions, transverse shear stresses, and column buckling loads.' },
    { co: 'CO4', desc: 'Calculate slope and deflection in flexural members using moment-area theorems.' },
    { co: 'CO5', desc: 'Evaluate combined direct and bending stresses in structural retaining walls and chimneys.' }
  ],
  'CE202': [
    { co: 'CO1', desc: 'Execute distance and angular measurements using chain, compass, and theodolite surveying.' },
    { co: 'CO2', desc: 'Perform leveling, contour plotting, profile computation, and earthwork volume calculation.' },
    { co: 'CO3', desc: 'Apply Total Station, GPS, and GIS digital mapping technologies in field layout.' },
    { co: 'CO4', desc: 'Set out simple circular and transition horizontal/vertical road curves.' },
    { co: 'CO5', desc: 'Conduct triangulation and trilateration surveys for high-accuracy civil infrastructure.' }
  ],
  'CE203': [
    { co: 'CO1', desc: 'Calculate hydrostatic pressure distributions on submerged planar and curved surfaces.' },
    { co: 'CO2', desc: 'Apply continuity, momentum, and Bernoulli energy equations to pipe flow systems.' },
    { co: 'CO3', desc: 'Evaluate laminar and turbulent pipe friction losses, hydraulic grade lines, and open channels.' },
    { co: 'CO4', desc: 'Design open channel flow sections for maximum hydraulic discharge.' },
    { co: 'CO5', desc: 'Analyze hydraulic jump dissipation, weir calibrations, and venturi flumes.' }
  ],
  'CE301': [
    { co: 'CO1', desc: 'Analyze indeterminate trusses, beams, and rigid frames using slope-deflection & moment distribution methods.' },
    { co: 'CO2', desc: 'Calculate influence line diagrams for moving live loads on bridge structures.' },
    { co: 'CO3', desc: 'Apply energy theorems (Castigliano\'s theorem, unit load method) for deflection calculation.' },
    { co: 'CO4', desc: 'Analyze two-hinged and fixed arches under uniformly distributed and concentrated loads.' },
    { co: 'CO5', desc: 'Perform matrix stiffness and flexibility analysis of skeletal structural frames.' }
  ]
};

@Component({
  selector: 'app-course-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <div class="header-title-group">
                <span class="header-pill">🎯 NBA Criteria-3 Compliant</span>
                <h1>Course Outcomes (CO) Directory</h1>
                <p>{{ role === 'faculty' ? 'Subject-wise Course Outcomes (CO1–CO5) strictly for your faculty curriculum and assigned subjects.' : 'Subject-wise Course Outcomes (CO1–CO5) articulating specific skills, knowledge, and competencies acquired by students.' }}</p>
            </div>
            <div class="header-actions" *ngIf="role === 'admin' || role === 'faculty'">
                <button type="button" class="primary-button" (click)="toggleForm()">
                    {{ showForm ? '✕ Close Form' : '+ Define New CO' }}
                </button>
            </div>
        </div>

        <!-- Faculty Context Banner -->
        <div class="branch-banner faculty-banner" *ngIf="role === 'faculty'">
            <div class="banner-icon">👨‍🏫</div>
            <div class="banner-details">
                <div class="banner-title-row">
                    <strong>{{ facultyDept }} — {{ facultyName }}</strong>
                    <span class="banner-tag faculty-tag">Faculty Outcomes Directory</span>
                </div>
                <p class="banner-sub">
                    Showing Course Outcomes (CO1–CO5) strictly mapped to your faculty subjects: 
                    <span class="assigned-chips">{{ facultyAssignedCoursesDisplay }}</span>.
                </p>
            </div>
        </div>

        <!-- Search and Summary Bar -->
        <div class="co-search-toolbar">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    (ngModelChange)="filterGroups()" 
                    placeholder="Search by subject name, course code (e.g. CS101, CS102), or outcome keywords..." 
                />
                <button *ngIf="searchQuery" type="button" class="clear-search" (click)="searchQuery=''; filterGroups()">✕</button>
            </div>
            <div class="stats-pills">
                <span class="stat-badge">📚 <strong>{{ filteredGroups.length }}</strong> Subjects</span>
                <span class="stat-badge gold">🎯 <strong>{{ totalCOsCount }}</strong> Defined COs</span>
            </div>
        </div>

        <!-- Create / Edit Outcome Form Card -->
        <div class="form-card" *ngIf="showForm">
            <div class="form-header">
                <h2>{{ editingIndex >= 0 ? 'Edit Course Outcome' : 'Define New Course Outcome' }}</h2>
                <button type="button" class="close-form-btn" (click)="toggleForm()">✕</button>
            </div>
            <form (ngSubmit)="saveOutcome()">
                <div class="form-grid">
                    <label>
                        Target Subject / Course
                        <select [(ngModel)]="currentOutcome.course" name="course" required>
                            <option value="" disabled selected>Select course</option>
                            <option *ngFor="let course of courses" [value]="course">{{ course }}</option>
                        </select>
                    </label>
                    <label>
                        CO Code
                        <input type="text" [(ngModel)]="currentOutcome.co" name="co" placeholder="e.g. CO1, CO2, CO3" required />
                    </label>
                </div>
                <label class="full-width">
                    Outcome Statement & Competency Description
                    <textarea rows="3" [(ngModel)]="currentOutcome.description" name="description" placeholder="Students will be able to design, analyze, and implement..." required></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit" class="primary-button">{{ editingIndex >= 0 ? 'Save Changes' : 'Save Course Outcome' }}</button>
                    <button type="button" class="secondary-button" (click)="resetForm(); showForm=false">Cancel</button>
                </div>
            </form>
        </div>

        <!-- SUBJECT-WISE CARDS CONTAINER -->
        <div class="subject-cards-list">
            <div *ngFor="let group of filteredGroups" class="subject-co-card">
                <!-- Subject Card Header -->
                <div class="subject-card-header" (click)="toggleGroup(group)">
                    <div class="subject-meta-left">
                        <span class="course-code-badge">{{ group.courseCode }}</span>
                        <h2 class="subject-name-title">{{ group.courseTitle }}</h2>
                        <span class="co-count-tag">{{ group.cos.length }} COs Registered</span>
                    </div>
                    <div class="subject-meta-right">
                        <button *ngIf="role === 'admin' || role === 'faculty'" 
                                type="button" 
                                class="add-co-mini-btn" 
                                (click)="$event.stopPropagation(); openAddCoModal(group)">
                            + Add CO
                        </button>
                        <button type="button" class="toggle-arrow-btn">
                            {{ group.isExpanded ? '▲ Hide COs' : '▼ View COs' }}
                        </button>
                    </div>
                </div>

                <!-- Subject Card Body: Expandable COs List -->
                <div class="subject-card-body" *ngIf="group.isExpanded">
                    <div *ngIf="group.cos.length === 0" class="empty-co-msg">
                        No Course Outcomes defined for this subject yet.
                    </div>

                    <div class="co-items-table" *ngIf="group.cos.length > 0">
                        <div *ngFor="let outcome of group.cos; index as i" class="co-item-card">
                            <div class="co-badge-col">
                                <span class="co-pill-label">{{ outcome.co }}</span>
                            </div>
                            <div class="co-desc-col">
                                <p class="co-desc-text">{{ outcome.description }}</p>
                            </div>
                            <div class="co-action-col" *ngIf="role === 'admin' || role === 'faculty'">
                                <button type="button" class="btn-action edit" (click)="editOutcome(outcome, i)">
                                    ✏️ Edit
                                </button>
                                <button type="button" class="btn-action delete" (click)="deleteOutcome(outcome.id)">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="filteredGroups.length === 0" class="empty-state-card">
                <span style="font-size: 2.5rem; margin-bottom: 8px;">🔍</span>
                <h3>No subjects match your search criteria.</h3>
                <p>Try searching with another keyword or course code.</p>
            </div>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }`,
    `.header-pill { display: inline-block; padding: 4px 10px; background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }`,
    
    `.branch-banner {
      background: linear-gradient(135deg, #101b38 0%, #18284e 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #1f2f54;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }`,
    `.faculty-banner {
      border-left: 4px solid #d4af37;
      background: linear-gradient(135deg, #101b38 0%, #1a2a50 100%);
    }`,
    `.banner-icon { font-size: 2.2rem; }`,
    `.banner-details { flex: 1; }`,
    `.banner-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }`,
    `.banner-title-row strong { font-size: 1.2rem; font-weight: 800; color: #ffffff; }`,
    `.banner-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); padding: 2px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800; }`,
    `.faculty-tag { background: rgba(212, 175, 55, 0.15); color: #d4af37; border-color: rgba(212, 175, 55, 0.4); }`,
    `.banner-sub { margin: 4px 0 0 0; font-size: 0.88rem; color: #94a3b8; line-height: 1.4; }`,
    `.assigned-chips { color: #facc15; font-weight: 700; }`,

    `.co-search-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }`,
    `.search-box { position: relative; display: flex; align-items: center; background: #091024; border: 1px solid #1f2f54; border-radius: 10px; padding: 0 14px; flex: 1; min-width: 280px; height: 44px; }`,
    `.search-box:focus-within { border-color: #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.25); }`,
    `.search-box .search-icon { font-size: 16px; color: #64748b; margin-right: 8px; }`,
    `.search-box input { background: transparent !important; border: none !important; color: #ffffff !important; font-size: 13.5px !important; width: 100% !important; outline: none !important; }`,
    `.clear-search { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; }`,
    `.stats-pills { display: flex; gap: 10px; }`,
    `.stat-badge { background: #101b38; border: 1px solid #1f2f54; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #cbd5e1; }`,
    `.stat-badge.gold { border-color: rgba(212, 175, 55, 0.35); color: #fde68a; background: rgba(212, 175, 55, 0.1); }`,
    `.form-card { background: #101b38; border: 1.5px solid #d4af37; border-radius: 14px; padding: 22px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4); margin-bottom: 24px; animation: fadeIn 0.25s ease; }`,
    `.form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #1f2f54; padding-bottom: 10px; }`,
    `.form-header h2 { margin: 0; font-size: 1.2rem; color: #ffffff; }`,
    `.close-form-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; }`,
    `.form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 14px; }`,
    `.form-card label { width: 100%; display: block; margin-bottom: 14px; font-weight: 600; color: #cbd5e1; font-size: 13px; }`,
    `.form-card input, .form-card select, .form-card textarea { width: 100%; padding: 10px 12px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 13.5px; margin-top: 6px; background: #091024; color: #ffffff; box-sizing: border-box; }`,
    `.form-actions { display: flex; gap: 12px; margin-top: 14px; }`,
    `.primary-button { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border: none; padding: 9px 20px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 13px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(212,175,55,0.3); }`,
    `.primary-button:hover { filter: brightness(1.1); transform: translateY(-1px); }`,
    `.secondary-button { background: #1f2f54; color: #cbd5e1; border: none; padding: 9px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }`,
    `.subject-cards-list { display: flex; flex-direction: column; gap: 16px; }`,
    `.subject-co-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); transition: border-color 0.2s ease; }`,
    `.subject-co-card:hover { border-color: rgba(212, 175, 55, 0.4); }`,
    `.subject-card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #0c152c; cursor: pointer; user-select: none; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid transparent; }`,
    `.subject-co-card:has(.subject-card-body) .subject-card-header { border-bottom-color: #1f2f54; }`,
    `.subject-meta-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }`,
    `.course-code-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-family: monospace; font-size: 0.85rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; }`,
    `.subject-name-title { margin: 0; font-size: 1.1rem; color: #ffffff; font-weight: 700; }`,
    `.co-count-tag { background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.3); font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; }`,
    `.subject-meta-right { display: flex; align-items: center; gap: 10px; }`,
    `.add-co-mini-btn { background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.35); padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }`,
    `.add-co-mini-btn:hover { background: #d4af37; color: #0a1128; }`,
    `.toggle-arrow-btn { background: #1a294c; color: #cbd5e1; border: 1px solid #1f2f54; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }`,
    `.subject-card-body { padding: 18px 20px; background: #091024; }`,
    `.co-items-table { display: flex; flex-direction: column; gap: 10px; }`,
    `.co-item-card { display: flex; align-items: center; gap: 16px; background: #101b38; border: 1px solid #1f2f54; border-radius: 10px; padding: 14px 16px; transition: all 0.2s ease; }`,
    `.co-item-card:hover { border-color: #38bdf8; background: #132247; }`,
    `.co-badge-col { width: 70px; flex-shrink: 0; }`,
    `.co-pill-label { display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); color: #ffffff; font-weight: 800; font-size: 0.85rem; padding: 6px 10px; border-radius: 6px; box-shadow: 0 2px 6px rgba(30, 64, 175, 0.3); }`,
    `.co-desc-col { flex: 1; }`,
    `.co-desc-text { margin: 0; font-size: 0.92rem; color: #e2e8f0; line-height: 1.5; }`,
    `.co-action-col { display: flex; gap: 8px; flex-shrink: 0; }`,
    `.btn-action { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.2s ease; }`,
    `.btn-action.edit { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }`,
    `.btn-action.edit:hover { background: rgba(56, 189, 248, 0.25); color: #ffffff; }`,
    `.btn-action.delete { background: rgba(239, 68, 68, 0.12); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }`,
    `.btn-action.delete:hover { background: rgba(239, 68, 68, 0.25); color: #ffffff; }`,
    `.empty-state-card { text-align: center; padding: 40px; background: #101b38; border: 1px dashed #1f2f54; border-radius: 14px; color: #94a3b8; }`,
    `@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`
  ]
})
export class CourseOutcomes {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  role: string | null = null;
  facultyName = '';
  facultyDept = 'Computer Science & Engineering';
  showForm = false;
  editingIndex = -1;
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];
  searchQuery = '';

  groupedSubjectOutcomes: GroupedSubjectCOs[] = [];
  filteredGroups: GroupedSubjectCOs[] = [];

  currentOutcome: CourseOutcome = this.createEmptyOutcome();

  get totalCOsCount(): number {
    return this.groupedSubjectOutcomes.reduce((sum, g) => sum + g.cos.length, 0);
  }

  get facultyAssignedCoursesDisplay(): string {
    const assigned = this.getRelevantCoursesForUser();
    if (assigned && assigned.length > 0) {
      return assigned.join(', ');
    }
    return 'Assigned Subjects';
  }

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.facultyName = localStorage.getItem('userName') || '';
    this.facultyDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Computer Science & Engineering';
    this.loadCourses();
    this.loadOutcomes();
  }

  createEmptyOutcome(): CourseOutcome {
    return { id: 0, course: '', co: '', description: '' };
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
    'IT113': 'IT113 - Problem Solving with C',
    'IT201': 'IT201 - Data Structures & Algorithms',
    'IT211': 'IT211 - Linux System Administration',
    'IT301': 'IT301 - Database Management Systems',
    'IT305': 'IT305 - Open Source Software Technologies',
    'EC111': 'EC111 - Linear Algebra & Transform Calculus',
    'EC114': 'EC114 - Basic Electrical & Electronics',
    'EC201': 'EC201 - Electronic Devices and Circuit Theory',
    'EC202': 'EC202 - Digital System Design',
    'EC211': 'EC211 - Analog Electronic Circuits',
    'EC301': 'EC301 - Signals and Systems',
    'EE111': 'EE111 - Calculus & Differential Equations',
    'EE201': 'EE201 - Electric Circuit Analysis',
    'ME111': 'ME111 - Calculus & Linear Algebra',
    'ME113': 'ME113 - Engineering Mechanics',
    'ME201': 'ME201 - Engineering Thermodynamics',
    'ME202': 'ME202 - Strength of Materials',
    'ME211': 'ME211 - Applied Thermodynamics',
    'ME301': 'ME301 - Fluid Mechanics & Hydraulic Machinery',
    'CE111': 'CE111 - Calculus & Linear Algebra',
    'CE113': 'CE113 - Engineering Mechanics (Civil)',
    'CE201': 'CE201 - Strength of Materials I',
    'CE202': 'CE202 - Surveying & Geomatics',
    'CE203': 'CE203 - Fluid Mechanics',
    'CE301': 'CE301 - Structural Analysis I'
  };

  getFullCourseName(courseStr: string): string {
    if (!courseStr) return '';
    const trimmed = courseStr.trim();
    if (this.courseFullNameMap[trimmed]) return this.courseFullNameMap[trimmed];
    
    // Check in database courses
    const dbMatch = DEFAULT_DATABASE_COURSES.find(c => 
      c.code.toLowerCase() === trimmed.toLowerCase() || 
      c.title.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().startsWith(c.code.toLowerCase())
    );
    if (dbMatch) {
      return `${dbMatch.code} - ${dbMatch.title}`;
    }

    for (const [k, v] of Object.entries(this.courseFullNameMap)) {
      if (trimmed.toLowerCase() === k.toLowerCase() || trimmed.toLowerCase().startsWith(k.toLowerCase())) {
        return v;
      }
    }
    const found = this.courses.find(c => c.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;

    return trimmed;
  }

  getRelevantCoursesForUser(): string[] {
    let assigned: string[] = [];
    try {
      const storedAssigned = localStorage.getItem('userAssignedCourses');
      if (storedAssigned) {
        const parsed = JSON.parse(storedAssigned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          assigned = parsed;
        }
      }
    } catch {}

    const dept = (localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'CSE').toLowerCase();

    if (this.role === 'faculty') {
      if (assigned.length === 0) {
        if (dept.includes('computer') || dept.includes('cse')) {
          assigned = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302', 'CS303', 'CS401', 'CS402'];
        } else if (dept.includes('information') || dept.includes('it')) {
          assigned = ['IT113', 'IT201', 'IT211', 'IT301', 'IT305'];
        } else if (dept.includes('electronic') || dept.includes('ece')) {
          assigned = ['EC114', 'EC201', 'EC202', 'EC211', 'EC301'];
        } else if (dept.includes('mechanical') || dept.includes('me')) {
          assigned = ['ME113', 'ME201', 'ME202', 'ME211', 'ME301'];
        } else if (dept.includes('civil') || dept === 'ce') {
          assigned = ['CE113', 'CE201', 'CE202', 'CE203', 'CE301'];
        } else {
          assigned = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202'];
        }
      }
      return assigned;
    }

    if (this.role === 'student') {
      try {
        const cached = localStorage.getItem('userEnrolledCourses');
        if (cached && cached.trim()) {
          const list = cached.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
          if (list.length > 0) return list;
        }
      } catch {}
      if (dept.includes('computer') || dept.includes('cse')) {
        assigned = ['CS101', 'CS102', 'CS103', 'CS203', 'CS204', 'CS101L', 'CS102L'];
      } else if (dept.includes('information') || dept.includes('it')) {
        assigned = ['IT113', 'IT201', 'IT211', 'IT301', 'IT305'];
      } else if (dept.includes('electronic') || dept.includes('ece')) {
        assigned = ['EC114', 'EC201', 'EC202', 'EC211', 'EC301'];
      } else if (dept.includes('mechanical') || dept.includes('me')) {
        assigned = ['ME113', 'ME201', 'ME202', 'ME211', 'ME301'];
      } else if (dept.includes('civil') || dept === 'ce') {
        assigned = ['CE113', 'CE201', 'CE202', 'CE203', 'CE301'];
      }
    }

    return assigned.length > 0 ? assigned : ['CS101', 'CS102', 'CS103', 'CS201', 'CS202'];
  }

  isCourseAllowed(courseStr: string): boolean {
    if (this.role !== 'faculty' && this.role !== 'student') return true;
    const assigned = this.getRelevantCoursesForUser();
    if (!assigned || assigned.length === 0) return true;
    const cLow = (courseStr || '').toLowerCase();
    return assigned.some(a => {
      const aLow = a.toLowerCase();
      return cLow === aLow || cLow.startsWith(aLow) || aLow.startsWith(cLow) || cLow.includes(aLow) || aLow.includes(cLow);
    });
  }

  loadCourses(): void {
    const assigned = this.getRelevantCoursesForUser();
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/courses?faculty=${facultyParam}` : 'http://localhost:8080/api/courses';

    this.http.get<Array<{ code: string; title: string }>>(url).subscribe({
      next: (courseList: Array<{ code: string; title: string }>) => {
        let list = courseList;
        if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
          list = courseList.filter((c: any) => this.isCourseAllowed(c.code || c.title));
        }
        if (list.length === 0 && assigned.length > 0) {
          this.courses = assigned.map(a => this.getFullCourseName(a));
        } else {
          this.courses = list
            .map((c: any) => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
            .filter(Boolean);
        }
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = assigned.map(a => this.getFullCourseName(a));
        this.groupOutcomesBySubject();
      }
    });
  }

  getStandardCOsForCourse(courseCode: string, courseTitle: string): CourseOutcome[] {
    const code = courseCode.toUpperCase();
    
    if (MASTER_COURSE_OUTCOMES[code]) {
      return MASTER_COURSE_OUTCOMES[code].map((item, idx) => ({
        id: idx + 1,
        course: courseCode,
        co: item.co,
        description: item.desc
      }));
    }

    const t = courseTitle.toLowerCase();
    if (code.startsWith('CS') || t.includes('program') || t.includes('data') || t.includes('software')) {
      return [
        { id: 1, course: courseCode, co: 'CO1', description: `Recall and outline fundamental syntax, architectural principles, and core concepts of ${courseTitle}.` },
        { id: 2, course: courseCode, co: 'CO2', description: `Design modular schemas, algorithms, and structured functions to solve computational problems in ${courseTitle}.` },
        { id: 3, course: courseCode, co: 'CO3', description: `Implement resilient software components and conduct automated test-driven verification for ${courseTitle}.` },
        { id: 4, course: courseCode, co: 'CO4', description: `Analyze algorithm efficiency, time-space complexity trade-offs, and debug runtime anomalies in ${courseTitle}.` },
        { id: 5, course: courseCode, co: 'CO5', description: `Develop robust end-to-end applications adhering to standard software engineering guidelines and industry best practices.` }
      ];
    }
    
    return [
      { id: 1, course: courseCode, co: 'CO1', description: `Understand and outline fundamental concepts, principles, and theoretical foundations of ${courseTitle}.` },
      { id: 2, course: courseCode, co: 'CO2', description: `Analyze technical specifications, model domain requirements, and evaluate solution constraints in ${courseTitle}.` },
      { id: 3, course: courseCode, co: 'CO3', description: `Apply practical frameworks, design constructs, and problem-solving methodologies for ${courseTitle}.` },
      { id: 4, course: courseCode, co: 'CO4', description: `Evaluate performance metrics, system tradeoffs, and quality verification standards.` },
      { id: 5, course: courseCode, co: 'CO5', description: `Synthesize comprehensive case studies, industrial applications, and engineering project deliverables.` }
    ];
  }

  groupOutcomesBySubject(): void {
    const groupMap = new Map<string, GroupedSubjectCOs>();

    // 1. Initialize groups from available assigned courses
    this.courses.forEach(fullCourseStr => {
      const parts = fullCourseStr.split(' - ');
      const code = parts[0]?.trim() || fullCourseStr;
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : code;

      if (this.isCourseAllowed(code)) {
        groupMap.set(code.toLowerCase(), {
          courseCode: code,
          courseTitle: title,
          fullCourseName: fullCourseStr,
          cos: [],
          isExpanded: true
        });
      }
    });

    // 2. Map existing Course Outcomes into respective subject groups
    this.courseOutcomes.forEach(co => {
      const rawCode = (co.course || '').split(' - ')[0].trim();
      const key = rawCode.toLowerCase();

      if (!this.isCourseAllowed(rawCode)) {
        return;
      }

      if (!groupMap.has(key)) {
        const full = this.getFullCourseName(co.course);
        const parts = full.split(' - ');
        const code = parts[0]?.trim() || co.course;
        const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : code;

        groupMap.set(key, {
          courseCode: code,
          courseTitle: title,
          fullCourseName: full,
          cos: [],
          isExpanded: true
        });
      }

      const grp = groupMap.get(key)!;
      if (!grp.cos.some(c => c.co.toLowerCase() === co.co.toLowerCase())) {
        grp.cos.push(co);
      }
    });

    // 3. For any assigned course with 0 COs, populate standard master COs
    groupMap.forEach(grp => {
      if (grp.cos.length === 0) {
        grp.cos = this.getStandardCOsForCourse(grp.courseCode, grp.courseTitle);
      }
      grp.cos.sort((a, b) => (a.co || '').localeCompare(b.co || '', undefined, { numeric: true }));
    });

    this.groupedSubjectOutcomes = Array.from(groupMap.values());
    this.filterGroups();
  }

  filterGroups(): void {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groupedSubjectOutcomes];
      return;
    }

    const q = this.searchQuery.trim().toLowerCase();
    this.filteredGroups = this.groupedSubjectOutcomes.filter(g =>
      g.courseCode.toLowerCase().includes(q) ||
      g.courseTitle.toLowerCase().includes(q) ||
      g.cos.some(co => co.co.toLowerCase().includes(q) || co.description.toLowerCase().includes(q))
    );
  }

  toggleGroup(group: GroupedSubjectCOs): void {
    group.isExpanded = !group.isExpanded;
  }

  openAddCoModal(group: GroupedSubjectCOs): void {
    this.resetForm();
    this.currentOutcome.course = group.fullCourseName;
    this.currentOutcome.co = 'CO' + (group.cos.length + 1);
    this.showForm = true;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  loadOutcomes(): void {
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/co?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/co';

    this.http.get<CourseOutcome[]>(url).subscribe({
      next: (data: CourseOutcome[]) => {
        let list = data;
        const assigned = this.getRelevantCoursesForUser();
        if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
          list = data.filter((co: CourseOutcome) => this.isCourseAllowed(co.course));
        }
        this.courseOutcomes = list;
        try {
          localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
        } catch {}
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsCourseOutcomes');
          let list = stored ? JSON.parse(stored) as CourseOutcome[] : [];
          const assigned = this.getRelevantCoursesForUser();
          if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
            list = list.filter(co => this.isCourseAllowed(co.course));
          }
          this.courseOutcomes = list;
        } catch {
          this.courseOutcomes = [];
        }
        this.groupOutcomesBySubject();
      }
    });
  }

  saveOutcomes(): void {
    try {
      localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
    } catch {}
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  saveOutcome(): void {
    if (!this.currentOutcome.course || !this.currentOutcome.co.trim() || !this.currentOutcome.description.trim()) {
      this.toast.warning('Please fill in all outcome fields.');
      return;
    }

    const rawCourse = this.currentOutcome.course.split('-')[0].trim();

    const payload = {
      id: this.currentOutcome.id > 0 ? this.currentOutcome.id : null,
      course: rawCourse,
      co: this.currentOutcome.co.trim().toUpperCase(),
      description: this.currentOutcome.description.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: (saved: CourseOutcome) => {
        this.toast.success(`Course Outcome ${payload.co} saved successfully.`);
        this.loadOutcomes();
        this.resetForm();
        this.showForm = false;
      },
      error: () => {
        if (this.editingIndex >= 0) {
          this.courseOutcomes[this.editingIndex] = { ...this.currentOutcome, course: rawCourse, co: payload.co };
          this.toast.success(`Course Outcome ${payload.co} updated.`);
        } else {
          const nextId = this.courseOutcomes.length ? Math.max(...this.courseOutcomes.map(o => o.id)) + 1 : 1;
          this.courseOutcomes = [...this.courseOutcomes, { ...this.currentOutcome, id: nextId, course: rawCourse, co: payload.co }];
          this.toast.success(`Course Outcome ${payload.co} created.`);
        }
        this.saveOutcomes();
        this.resetForm();
        this.showForm = false;
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      }
    });
  }

  editOutcome(outcome: CourseOutcome, index: number): void {
    this.editingIndex = index;
    const match = this.courses.find(c => c.toLowerCase().includes(outcome.course.toLowerCase())) || outcome.course;
    this.currentOutcome = { ...outcome, course: match };
    this.showForm = true;
  }

  deleteOutcome(id: number): void {
    this.http.delete('http://localhost:8080/api/copo/co/' + id).subscribe({
      next: () => {
        this.toast.info('Course Outcome removed.');
        this.loadOutcomes();
      },
      error: () => {
        this.courseOutcomes = this.courseOutcomes.filter(o => o.id !== id);
        this.saveOutcomes();
        this.toast.info('Course Outcome removed.');
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      }
    });
    if (this.editingIndex >= 0 && this.courseOutcomes[this.editingIndex]?.id !== id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingIndex = -1;
    this.currentOutcome = this.createEmptyOutcome();
  }
}
