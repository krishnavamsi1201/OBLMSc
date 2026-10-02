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
  { id: 101, code: 'CS111', title: 'Calculus & Linear Algebra', faculty: 'Dr. Satish Sharma', semester: 'Semester 1' },
  { id: 102, code: 'CS112', title: 'Applied Engineering Physics', faculty: 'Prof. Ananya Sen', semester: 'Semester 1' },
  { id: 103, code: 'CS113', title: 'Problem Solving and Programming in C', faculty: 'Dr. Ramesh Babu', semester: 'Semester 1' },
  { id: 104, code: 'CS114', title: 'Basic Electrical & Electronics Engineering', faculty: 'Dr. Priya Nair', semester: 'Semester 1' },
  { id: 105, code: 'CS111L', title: 'C Programming Laboratory', faculty: 'Dr. Ramesh Babu', semester: 'Semester 1' },
  { id: 106, code: 'CS121', title: 'Advanced Differential Equations & Transforms', faculty: 'Dr. Satish Sharma', semester: 'Semester 2' },
  { id: 107, code: 'CS122', title: 'Engineering Chemistry & Materials Science', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 2' },
  { id: 108, code: 'CS123', title: 'Python Programming for Problem Solving', faculty: 'Prof. Sunita Sharma', semester: 'Semester 2' },
  { id: 109, code: 'CS124', title: 'Basic Mechanical & Civil Engineering', faculty: 'Dr. K. Srinivas', semester: 'Semester 2' },
  { id: 110, code: 'CS121L', title: 'Python Programming Laboratory', faculty: 'Prof. Sunita Sharma', semester: 'Semester 2' },
  { id: 1, code: 'CS101', title: 'Database Management Systems', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 2, code: 'CS102', title: 'Data Structures & Algorithms', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
  { id: 3, code: 'CS103', title: 'Object-Oriented Programming with Java', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 111, code: 'CS203', title: 'Discrete Mathematical Structures', faculty: 'Dr. Satish Sharma', semester: 'Semester 3' },
  { id: 131, code: 'CS204', title: 'Computer Organization & Microarchitecture', faculty: 'Dr. Priya Nair', semester: 'Semester 3' },
  { id: 112, code: 'CS101L', title: 'DBMS & SQL Practical Laboratory', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 132, code: 'CS102L', title: 'Data Structures & Algorithms Laboratory', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
  { id: 4, code: 'CS201', title: 'Operating Systems & Kernel Architecture', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
  { id: 113, code: 'CS205', title: 'Design and Analysis of Algorithms', faculty: 'Prof. Sunita Sharma', semester: 'Semester 4' },
  { id: 114, code: 'CS206', title: 'Formal Languages & Automata Theory', faculty: 'Prof. Rajesh Verma', semester: 'Semester 4' },
  { id: 115, code: 'CS207', title: 'Computer Organization & Architecture', faculty: 'Dr. Priya Nair', semester: 'Semester 4' },
  { id: 116, code: 'CS201L', title: 'Operating Systems Laboratory', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
  { id: 6, code: 'CS301', title: 'Computer Networks & Protocols', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 5, code: 'CS202', title: 'Machine Learning & Data Science', faculty: 'Prof. Sunita Sharma', semester: 'Semester 5' },
  { id: 117, code: 'CS304', title: 'Database System Implementation & Tuning', faculty: 'Dr. Ramesh Babu', semester: 'Semester 5' },
  { id: 118, code: 'CS306', title: 'Web Technologies & Modern Frameworks', faculty: 'Dr. Amit Patel', semester: 'Semester 5' },
  { id: 119, code: 'CS301L', title: 'Computer Networks Laboratory', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 7, code: 'CS302', title: 'Software Engineering & Agile Methodologies', faculty: 'Prof. Rajesh Verma', semester: 'Semester 6' },
  { id: 8, code: 'CS303', title: 'Cloud Computing & DevOps Architecture', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
  { id: 120, code: 'CS307', title: 'Compiler Design & Program Analysis', faculty: 'Dr. Ramesh Babu', semester: 'Semester 6' },
  { id: 121, code: 'CS308', title: 'Artificial Intelligence Principles', faculty: 'Prof. Sunita Sharma', semester: 'Semester 6' },
  { id: 122, code: 'CS302L', title: 'Software Engineering & CASE Tools Lab', faculty: 'Prof. Rajesh Verma', semester: 'Semester 6' },
  { id: 9, code: 'CS401', title: 'Deep Learning & Neural Networks', faculty: 'Dr. Ramesh Babu', semester: 'Semester 7' },
  { id: 10, code: 'CS402', title: 'Cyber Security & Digital Forensics', faculty: 'Prof. Rajesh Verma', semester: 'Semester 7' },
  { id: 123, code: 'CS403', title: 'Big Data Analytics & Distributed Systems', faculty: 'Dr. Amit Patel', semester: 'Semester 7' },
  { id: 124, code: 'CS405', title: 'Natural Language Processing', faculty: 'Prof. Sunita Sharma', semester: 'Semester 7' },
  { id: 125, code: 'CS401L', title: 'Deep Learning & AI Research Laboratory', faculty: 'Dr. Ramesh Babu', semester: 'Semester 7' },
  { id: 126, code: 'CS411', title: 'Internet of Things (IoT) & Edge Computing', faculty: 'Dr. Priya Nair', semester: 'Semester 8' },
  { id: 127, code: 'CS413', title: 'Blockchain Technology & Smart Contracts', faculty: 'Dr. Amit Patel', semester: 'Semester 8' },
  { id: 128, code: 'CS414', title: 'Autonomous Agents & Reinforcement Learning', faculty: 'Prof. Sunita Sharma', semester: 'Semester 8' },
  { id: 129, code: 'CS498', title: 'Major Capstone Project Phase II', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 130, code: 'CS499', title: 'Comprehensive Curriculum Viva Voce', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 201, code: 'IT111', title: 'Calculus for Computing Sciences', faculty: 'Dr. Satish Sharma', semester: 'Semester 1' },
  { id: 202, code: 'IT112', title: 'Applied Physics for Information Science', faculty: 'Prof. Ananya Sen', semester: 'Semester 1' },
  { id: 203, code: 'IT113', title: 'Problem Solving with C', faculty: 'Dr. Amit Patel', semester: 'Semester 1' },
  { id: 204, code: 'IT114', title: 'Introduction to Information Technology', faculty: 'Prof. Rajesh Verma', semester: 'Semester 1' },
  { id: 205, code: 'IT111L', title: 'C Programming Laboratory', faculty: 'Dr. Amit Patel', semester: 'Semester 1' },
  { id: 206, code: 'IT121', title: 'Differential Equations & Numerical Methods', faculty: 'Dr. Satish Sharma', semester: 'Semester 2' },
  { id: 207, code: 'IT122', title: 'Chemistry of Electronic Materials', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 2' },
  { id: 208, code: 'IT123', title: 'Python Programming for IT', faculty: 'Prof. Sunita Sharma', semester: 'Semester 2' },
  { id: 209, code: 'IT124', title: 'Basics of Electrical & Electronics Engineering', faculty: 'Dr. Priya Nair', semester: 'Semester 2' },
  { id: 210, code: 'IT121L', title: 'Python Laboratory', faculty: 'Prof. Sunita Sharma', semester: 'Semester 2' },
  { id: 211, code: 'IT201', title: 'Data Structures using C++', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
  { id: 212, code: 'IT202', title: 'Object-Oriented Programming with Java', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
  { id: 213, code: 'IT203', title: 'Discrete Mathematics for IT', faculty: 'Dr. Satish Sharma', semester: 'Semester 3' },
  { id: 214, code: 'IT204', title: 'Digital Electronics and Logic Design', faculty: 'Dr. Priya Nair', semester: 'Semester 3' },
  { id: 215, code: 'IT201L', title: 'Data Structures Laboratory', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
  { id: 216, code: 'IT211', title: 'Operating Systems Administration', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
  { id: 217, code: 'IT212', title: 'Relational Database Management Systems', faculty: 'Dr. Ramesh Babu', semester: 'Semester 4' },
  { id: 218, code: 'IT213', title: 'Design & Analysis of IT Algorithms', faculty: 'Prof. Sunita Sharma', semester: 'Semester 4' },
  { id: 219, code: 'IT214', title: 'Theory of Computation & Automata', faculty: 'Prof. Rajesh Verma', semester: 'Semester 4' },
  { id: 220, code: 'IT211L', title: 'Linux OS Administration Lab', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
  { id: 221, code: 'IT301', title: 'Computer Communication Networks', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 222, code: 'IT302', title: 'Web Architecture & Full Stack API Design', faculty: 'Dr. Amit Patel', semester: 'Semester 5' },
  { id: 223, code: 'IT303', title: 'Linux System Administration & Shell Scripting', faculty: 'Prof. Rajesh Verma', semester: 'Semester 5' },
  { id: 224, code: 'IT305', title: 'Open Source Software Technologies', faculty: 'Prof. Sunita Sharma', semester: 'Semester 5' },
  { id: 225, code: 'IT301L', title: 'Network Configuration & Socket Lab', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 226, code: 'IT311', title: 'Cloud Infrastructure & Virtualization', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
  { id: 227, code: 'IT312', title: 'Software Quality Assurance & Automation Testing', faculty: 'Prof. Rajesh Verma', semester: 'Semester 6' },
  { id: 228, code: 'IT313', title: 'Information Security & Applied Cryptography', faculty: 'Dr. Priya Nair', semester: 'Semester 6' },
  { id: 229, code: 'IT315', title: 'Mobile Application Development (Flutter/Android)', faculty: 'Dr. Ramesh Babu', semester: 'Semester 6' },
  { id: 230, code: 'IT311L', title: 'Cloud Microservices & Containers Lab', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
  { id: 231, code: 'IT401', title: 'DevOps & CI/CD Pipeline Automation', faculty: 'Dr. Amit Patel', semester: 'Semester 7' },
  { id: 232, code: 'IT402', title: 'Big Data Analytics & Hadoop Ecosystem', faculty: 'Prof. Sunita Sharma', semester: 'Semester 7' },
  { id: 233, code: 'IT403', title: 'Enterprise Web Applications Engineering', faculty: 'Dr. Ramesh Babu', semester: 'Semester 7' },
  { id: 234, code: 'IT405', title: 'Information Storage & Management', faculty: 'Dr. Priya Nair', semester: 'Semester 7' },
  { id: 235, code: 'IT401L', title: 'DevOps & Containerization Lab', faculty: 'Dr. Amit Patel', semester: 'Semester 7' },
  { id: 236, code: 'IT411', title: 'Cloud Security, Governance & Compliance', faculty: 'Dr. Amit Patel', semester: 'Semester 8' },
  { id: 237, code: 'IT413', title: 'Virtual Reality & Augmented Reality Systems', faculty: 'Dr. Ramesh Babu', semester: 'Semester 8' },
  { id: 238, code: 'IT414', title: 'Full Stack MEAN/MERN Web Engineering', faculty: 'Prof. Sunita Sharma', semester: 'Semester 8' },
  { id: 239, code: 'IT498', title: 'IT Industry Capstone Project', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 240, code: 'IT499', title: 'Comprehensive Technical Seminar & Viva', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 301, code: 'EC111', title: 'Calculus and Complex Variables', faculty: 'Dr. Satish Sharma', semester: 'Semester 1' },
  { id: 302, code: 'EC112', title: 'Engineering Physics for Electronics', faculty: 'Prof. Ananya Sen', semester: 'Semester 1' },
  { id: 303, code: 'EC113', title: 'C Programming for Engineers', faculty: 'Dr. Amit Patel', semester: 'Semester 1' },
  { id: 304, code: 'EC114', title: 'Basics of Electrical & Electronics Engineering', faculty: 'Dr. V. C. Reddy', semester: 'Semester 1' },
  { id: 305, code: 'EC111L', title: 'C Programming Laboratory', faculty: 'Dr. Amit Patel', semester: 'Semester 1' },
  { id: 306, code: 'EC121', title: 'Linear Algebra & Numerical Transforms', faculty: 'Dr. Satish Sharma', semester: 'Semester 2' },
  { id: 307, code: 'EC122', title: 'Solid State Chemistry & Materials', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 2' },
  { id: 308, code: 'EC123', title: 'Electric Circuit Theory & Network Analysis', faculty: 'Dr. V. C. Reddy', semester: 'Semester 2' },
  { id: 309, code: 'EC124', title: 'Electrical Machines & Power Systems', faculty: 'Dr. Priya Nair', semester: 'Semester 2' },
  { id: 310, code: 'EC121L', title: 'Electric Circuits & Simulation Lab', faculty: 'Dr. V. C. Reddy', semester: 'Semester 2' },
  { id: 311, code: 'EC201', title: 'Electronic Devices & Semiconductor Physics', faculty: 'Dr. V. C. Reddy', semester: 'Semester 3' },
  { id: 312, code: 'EC202', title: 'Digital Electronics & Logic Design', faculty: 'Dr. Priya Nair', semester: 'Semester 3' },
  { id: 313, code: 'EC203', title: 'Signals, Systems and Transforms', faculty: 'Dr. Satish Sharma', semester: 'Semester 3' },
  { id: 314, code: 'EC204', title: 'Electromagnetic Fields & Waves', faculty: 'Prof. Ananya Sen', semester: 'Semester 3' },
  { id: 315, code: 'EC201L', title: 'Electronic Devices & Circuits Lab', faculty: 'Dr. V. C. Reddy', semester: 'Semester 3' },
  { id: 316, code: 'EC211', title: 'Analog Circuits & Linear Amplifiers', faculty: 'Dr. V. C. Reddy', semester: 'Semester 4' },
  { id: 317, code: 'EC212', title: 'Microprocessors & Microcontroller Interfacing', faculty: 'Dr. Priya Nair', semester: 'Semester 4' },
  { id: 318, code: 'EC213', title: 'Analog Communication Systems', faculty: 'Prof. Ananya Sen', semester: 'Semester 4' },
  { id: 319, code: 'EC214', title: 'Linear Integrated Circuits & OP-AMPs', faculty: 'Dr. V. C. Reddy', semester: 'Semester 4' },
  { id: 320, code: 'EC211L', title: 'Analog Integrated Circuits Lab', faculty: 'Dr. V. C. Reddy', semester: 'Semester 4' },
  { id: 321, code: 'EC301', title: 'Digital Communication & Modulation', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 322, code: 'EC302', title: 'Microcontrollers & ARM Architecture', faculty: 'Dr. V. C. Reddy', semester: 'Semester 5' },
  { id: 323, code: 'EC303', title: 'Digital Signal Processing (DSP)', faculty: 'Dr. Satish Sharma', semester: 'Semester 5' },
  { id: 324, code: 'EC304', title: 'Antennas and Radio Wave Propagation', faculty: 'Prof. Ananya Sen', semester: 'Semester 5' },
  { id: 325, code: 'EC301L', title: 'Digital Communication Laboratory', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
  { id: 326, code: 'EC311', title: 'VLSI Circuit Design & CMOS Technology', faculty: 'Dr. V. C. Reddy', semester: 'Semester 6' },
  { id: 327, code: 'EC312', title: 'Wireless & Cellular Communications', faculty: 'Dr. Priya Nair', semester: 'Semester 6' },
  { id: 328, code: 'EC313', title: 'Microwave and Radar Engineering', faculty: 'Prof. Ananya Sen', semester: 'Semester 6' },
  { id: 329, code: 'EC314', title: 'Embedded Real-Time Operating Systems (RTOS)', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
  { id: 330, code: 'EC311L', title: 'VLSI Design & Cadence EDA Lab', faculty: 'Dr. V. C. Reddy', semester: 'Semester 6' },
  { id: 331, code: 'EC401', title: 'RF and Microwave Circuit Design', faculty: 'Prof. Ananya Sen', semester: 'Semester 7' },
  { id: 332, code: 'EC402', title: 'Satellite and Space Communications', faculty: 'Dr. Priya Nair', semester: 'Semester 7' },
  { id: 333, code: 'EC403', title: 'IoT Architecture, Sensors & Actuators', faculty: 'Dr. V. C. Reddy', semester: 'Semester 7' },
  { id: 334, code: 'EC405', title: 'Digital Image & Video Processing', faculty: 'Prof. Sunita Sharma', semester: 'Semester 7' },
  { id: 335, code: 'EC401L', title: 'RF Microwave Measurement Lab', faculty: 'Prof. Ananya Sen', semester: 'Semester 7' },
  { id: 336, code: 'EC411', title: 'Next-Gen 5G/6G Wireless Networks', faculty: 'Dr. Priya Nair', semester: 'Semester 8' },
  { id: 337, code: 'EC412', title: 'Mixed Signal CMOS Integrated Circuits', faculty: 'Dr. V. C. Reddy', semester: 'Semester 8' },
  { id: 338, code: 'EC413', title: 'Robotics, Automation & Machine Vision', faculty: 'Dr. Amit Patel', semester: 'Semester 8' },
  { id: 339, code: 'EC498', title: 'Major Capstone Project Phase II', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 340, code: 'EC499', title: 'Comprehensive Technical Viva Voce', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 401, code: 'ME111', title: 'Calculus & Analytical Geometry', faculty: 'Dr. Satish Sharma', semester: 'Semester 1' },
  { id: 402, code: 'ME112', title: 'Engineering Physics for Mechanics', faculty: 'Prof. Ananya Sen', semester: 'Semester 1' },
  { id: 403, code: 'ME113', title: 'Engineering Mechanics (Statics & Dynamics)', faculty: 'Dr. K. Srinivas', semester: 'Semester 1' },
  { id: 404, code: 'ME114', title: 'Basic Electrical & Electronics', faculty: 'Dr. Priya Nair', semester: 'Semester 1' },
  { id: 405, code: 'ME111L', title: 'Workshop & Manufacturing Practice Lab', faculty: 'Dr. K. Srinivas', semester: 'Semester 1' },
  { id: 406, code: 'ME121', title: 'Differential Equations & Laplace Transforms', faculty: 'Dr. Satish Sharma', semester: 'Semester 2' },
  { id: 407, code: 'ME122', title: 'Materials Science and Engineering Metallurgy', faculty: 'Dr. K. Srinivas', semester: 'Semester 2' },
  { id: 408, code: 'ME123', title: 'Computer Programming in C', faculty: 'Dr. Amit Patel', semester: 'Semester 2' },
  { id: 409, code: 'ME124', title: 'Basic Electronics & Instrumentation', faculty: 'Dr. V. C. Reddy', semester: 'Semester 2' },
  { id: 410, code: 'ME121L', title: 'C Programming Laboratory', faculty: 'Dr. Amit Patel', semester: 'Semester 2' },
  { id: 411, code: 'ME201', title: 'Engineering Thermodynamics', faculty: 'Dr. K. Srinivas', semester: 'Semester 3' },
  { id: 412, code: 'ME202', title: 'Strength of Materials & Mechanics of Solids', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 3' },
  { id: 413, code: 'ME203', title: 'Manufacturing Technology I (Casting & Welding)', faculty: 'Prof. Manoj Kumar', semester: 'Semester 3' },
  { id: 414, code: 'ME204', title: 'Fluid Mechanics and Hydraulic Machinery', faculty: 'Dr. K. Srinivas', semester: 'Semester 3' },
  { id: 415, code: 'ME202L', title: 'Strength of Materials Laboratory', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 3' },
  { id: 416, code: 'ME211', title: 'Applied Thermodynamics & Steam Power', faculty: 'Dr. K. Srinivas', semester: 'Semester 4' },
  { id: 417, code: 'ME212', title: 'Dynamics of Machinery & Vibrations', faculty: 'Prof. Manoj Kumar', semester: 'Semester 4' },
  { id: 418, code: 'ME213', title: 'Manufacturing Technology II (Machining & Forming)', faculty: 'Prof. Manoj Kumar', semester: 'Semester 4' },
  { id: 419, code: 'ME214', title: 'Mechanical Measurements and Metrology', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 4' },
  { id: 420, code: 'ME211L', title: 'Thermal Engineering Laboratory I', faculty: 'Dr. K. Srinivas', semester: 'Semester 4' },
  { id: 421, code: 'ME301', title: 'Heat and Mass Transfer', faculty: 'Dr. K. Srinivas', semester: 'Semester 5' },
  { id: 422, code: 'ME302', title: 'Design of Machine Elements I', faculty: 'Prof. Manoj Kumar', semester: 'Semester 5' },
  { id: 423, code: 'ME303', title: 'Internal Combustion Engines & Gas Turbines', faculty: 'Dr. K. Srinivas', semester: 'Semester 5' },
  { id: 424, code: 'ME304', title: 'Automobile Chassis & Powertrain Engineering', faculty: 'Prof. Manoj Kumar', semester: 'Semester 5' },
  { id: 425, code: 'ME301L', title: 'Heat Transfer Laboratory', faculty: 'Dr. K. Srinivas', semester: 'Semester 5' },
  { id: 426, code: 'ME311', title: 'Computer Aided Design & Manufacturing (CAD/CAM)', faculty: 'Prof. Manoj Kumar', semester: 'Semester 6' },
  { id: 427, code: 'ME312', title: 'Design of Transmission Systems & Gears', faculty: 'Prof. Manoj Kumar', semester: 'Semester 6' },
  { id: 428, code: 'ME313', title: 'Finite Element Analysis (FEA)', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 6' },
  { id: 429, code: 'ME314', title: 'Refrigeration and Air Conditioning', faculty: 'Dr. K. Srinivas', semester: 'Semester 6' },
  { id: 430, code: 'ME311L', title: 'CAD/CAM & CNC Machining Lab', faculty: 'Prof. Manoj Kumar', semester: 'Semester 6' },
  { id: 431, code: 'ME401', title: 'Mechatronics and Industrial Automation', faculty: 'Dr. Amit Patel', semester: 'Semester 7' },
  { id: 432, code: 'ME402', title: 'Power Plant Engineering & Energy Systems', faculty: 'Dr. K. Srinivas', semester: 'Semester 7' },
  { id: 433, code: 'ME403', title: 'Robotics and Flexible Manufacturing Systems', faculty: 'Prof. Manoj Kumar', semester: 'Semester 7' },
  { id: 434, code: 'ME404', title: 'Computational Fluid Dynamics (CFD)', faculty: 'Dr. K. Srinivas', semester: 'Semester 7' },
  { id: 435, code: 'ME401L', title: 'Mechatronics and Robotics Lab', faculty: 'Dr. Amit Patel', semester: 'Semester 7' },
  { id: 436, code: 'ME411', title: 'Renewable Energy Technologies & Solar Thermal', faculty: 'Dr. K. Srinivas', semester: 'Semester 8' },
  { id: 437, code: 'ME412', title: 'Total Quality Management (TQM) & Six Sigma', faculty: 'Prof. Rajesh Verma', semester: 'Semester 8' },
  { id: 438, code: 'ME414', title: 'Electric & Hybrid Vehicle Engineering', faculty: 'Prof. Manoj Kumar', semester: 'Semester 8' },
  { id: 439, code: 'ME498', title: 'Major Capstone Project Phase II', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 440, code: 'ME499', title: 'Comprehensive Technical Viva Voce', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 501, code: 'CE111', title: 'Calculus & Linear Algebra', faculty: 'Dr. Satish Sharma', semester: 'Semester 1' },
  { id: 502, code: 'CE112', title: 'Engineering Physics for Civil Engineering', faculty: 'Prof. Ananya Sen', semester: 'Semester 1' },
  { id: 503, code: 'CE113', title: 'Engineering Mechanics & Structural Statics', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 1' },
  { id: 504, code: 'CE114', title: 'Basic Electrical & Mechanical Engineering', faculty: 'Dr. K. Srinivas', semester: 'Semester 1' },
  { id: 505, code: 'CE111L', title: 'Civil Workshop Practice Lab', faculty: 'Prof. Suresh Reddy', semester: 'Semester 1' },
  { id: 506, code: 'CE121', title: 'Differential Equations & Numerical Methods', faculty: 'Dr. Satish Sharma', semester: 'Semester 2' },
  { id: 507, code: 'CE122', title: 'Engineering Chemistry & Environmental Materials', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 2' },
  { id: 508, code: 'CE123', title: 'Problem Solving and Programming in C', faculty: 'Dr. Amit Patel', semester: 'Semester 2' },
  { id: 509, code: 'CE124', title: 'Building Materials and Construction Practices', faculty: 'Prof. Suresh Reddy', semester: 'Semester 2' },
  { id: 510, code: 'CE121L', title: 'C Programming Laboratory', faculty: 'Dr. Amit Patel', semester: 'Semester 2' },
  { id: 511, code: 'CE201', title: 'Strength of Materials I', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 3' },
  { id: 512, code: 'CE202', title: 'Surveying and Geomatics I', faculty: 'Prof. Suresh Reddy', semester: 'Semester 3' },
  { id: 513, code: 'CE203', title: 'Fluid Mechanics & Open Channel Flow', faculty: 'Dr. K. Srinivas', semester: 'Semester 3' },
  { id: 514, code: 'CE204', title: 'Engineering Geology and Rock Mechanics', faculty: 'Prof. Suresh Reddy', semester: 'Semester 3' },
  { id: 515, code: 'CE201L', title: 'Strength of Materials Laboratory', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 3' },
  { id: 516, code: 'CE211', title: 'Strength of Materials II & Structural Mechanics', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 4' },
  { id: 517, code: 'CE212', title: 'Hydraulics and Hydraulic Machinery', faculty: 'Dr. K. Srinivas', semester: 'Semester 4' },
  { id: 518, code: 'CE213', title: 'Structural Analysis I', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 4' },
  { id: 519, code: 'CE214', title: 'Concrete Technology & Mix Design', faculty: 'Prof. Suresh Reddy', semester: 'Semester 4' },
  { id: 520, code: 'CE212L', title: 'Fluid Mechanics & Hydraulics Lab', faculty: 'Dr. K. Srinivas', semester: 'Semester 4' },
  { id: 521, code: 'CE301', title: 'Structural Analysis II (Matrix Methods)', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 5' },
  { id: 522, code: 'CE302', title: 'Design of Reinforced Concrete Structures (RCC)', faculty: 'Prof. Suresh Reddy', semester: 'Semester 5' },
  { id: 523, code: 'CE303', title: 'Geotechnical Engineering I (Soil Mechanics)', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 5' },
  { id: 524, code: 'CE304', title: 'Environmental Engineering I (Water Supply)', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 5' },
  { id: 525, code: 'CE303L', title: 'Soil Mechanics & Geotechnical Lab', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 5' },
  { id: 526, code: 'CE311', title: 'Design of Steel Structures (IS 800)', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 6' },
  { id: 527, code: 'CE312', title: 'Geotechnical Engineering II (Foundation Engineering)', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 6' },
  { id: 528, code: 'CE313', title: 'Environmental Engineering II (Wastewater Treatment)', faculty: 'Prof. Meenakshi Sundaram', semester: 'Semester 6' },
  { id: 529, code: 'CE314', title: 'Highway, Railway & Airport Engineering', faculty: 'Prof. Suresh Reddy', semester: 'Semester 6' },
  { id: 530, code: 'CE311L', title: 'Structural Steel Detailing & STAAD.Pro Lab', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 6' },
  { id: 531, code: 'CE401', title: 'Estimation, Costing, Valuation & Specifications', faculty: 'Prof. Suresh Reddy', semester: 'Semester 7' },
  { id: 532, code: 'CE402', title: 'Design of Prestressed Concrete Structures', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 7' },
  { id: 533, code: 'CE403', title: 'Construction Planning, Scheduling & Management', faculty: 'Prof. Rajesh Verma', semester: 'Semester 7' },
  { id: 534, code: 'CE404', title: 'Earthquake Resistant Design of Structures', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 7' },
  { id: 535, code: 'CE401L', title: 'GIS & Quantity Surveying Software Lab', faculty: 'Prof. Suresh Reddy', semester: 'Semester 7' },
  { id: 536, code: 'CE411', title: 'Bridge Engineering & Structural Design', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 8' },
  { id: 537, code: 'CE412', title: 'Ground Improvement Techniques & Geosynthetics', faculty: 'Dr. Rajesh Gupta', semester: 'Semester 8' },
  { id: 538, code: 'CE413', title: 'Urban Transportation Planning & Traffic Engineering', faculty: 'Prof. Suresh Reddy', semester: 'Semester 8' },
  { id: 539, code: 'CE498', title: 'Civil Engineering Capstone Project Phase II', faculty: 'Faculty Board', semester: 'Semester 8' },
  { id: 540, code: 'CE499', title: 'Comprehensive Technical Seminar & Viva Voce', faculty: 'Faculty Board', semester: 'Semester 8' }
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
        if (Array.isArray(parsed) && parsed.length === DEFAULT_DATABASE_COURSES.length) {
          const sanitized = parsed.map(c => {
            if (c.faculty === 'Dr. Ramesh Kumar') {
              return { ...c, faculty: 'Dr. Ramesh Babu' };
            }
            return c;
          });
          this.syncCourseSubjects(sanitized);
          return sanitized;
        }
      }
    } catch {}

    // Initialize with default accredited courses (5 per semester)
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
