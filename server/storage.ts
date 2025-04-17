import { 
  users, User, InsertUser,
  students, Student, InsertStudent,
  courses, Course, InsertCourse,
  attendances, Attendance, InsertAttendance
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLanguage(userId: number, language: string): Promise<User | undefined>;
  
  // Student methods
  createStudent(student: InsertStudent): Promise<Student>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByCourse(courseId: number): Promise<Student[]>;
  
  // Course methods
  createCourse(course: InsertCourse): Promise<Course>;
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Attendance methods
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendancesByStudent(studentId: number): Promise<Attendance[]>;
  getAttendancesByCourse(courseId: number): Promise<Attendance[]>;
  getAttendancesByDate(courseId: number, date: Date): Promise<Attendance[]>;
  getRecentAttendances(limit: number): Promise<(Attendance & { student: Student, course: Course })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private courses: Map<number, Course>;
  private attendances: Map<number, Attendance>;
  private currentUserId: number;
  private currentStudentId: number;
  private currentCourseId: number;
  private currentAttendanceId: number;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.courses = new Map();
    this.attendances = new Map();
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentCourseId = 1;
    this.currentAttendanceId = 1;
    
    // Initialize with a sample user
    this.createUser({
      username: "faculty",
      password: "password",
      name: "Prof. Jane Smith",
      department: "Computer Science",
      language: "en",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUserLanguage(userId: number, language: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, language };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Student methods
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const student: Student = { ...insertStudent, id, createdAt: new Date() };
    this.students.set(id, student);
    
    // Update course total students
    if (student.courses) {
      for (const courseCode of student.courses) {
        const course = Array.from(this.courses.values()).find(c => c.code === courseCode);
        if (course) {
          const updatedCourse = { ...course, totalStudents: (course.totalStudents || 0) + 1 };
          this.courses.set(course.id, updatedCourse);
        }
      }
    }
    
    return student;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.studentId === studentId,
    );
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const existingStudent = await this.getStudent(id);
    if (!existingStudent) return undefined;
    
    const updatedStudent = { ...existingStudent, ...student };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentsByCourse(courseId: number): Promise<Student[]> {
    const course = await this.getCourse(courseId);
    if (!course) return [];
    
    return Array.from(this.students.values()).filter(student => 
      student.courses && student.courses.includes(course.code)
    );
  }

  // Course methods
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const course: Course = { ...insertCourse, id, createdAt: new Date() };
    this.courses.set(id, course);
    return course;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.instructorId === instructorId
    );
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = await this.getCourse(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse = { ...existingCourse, ...course };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Attendance methods
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendances.set(id, attendance);
    return attendance;
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendances.get(id);
  }

  async getAttendancesByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(
      attendance => attendance.studentId === studentId
    );
  }

  async getAttendancesByCourse(courseId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(
      attendance => attendance.courseId === courseId
    );
  }

  async getAttendancesByDate(courseId: number, date: Date): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.attendances.values()).filter(
      attendance => 
        attendance.courseId === courseId && 
        attendance.date >= startOfDay && 
        attendance.date <= endOfDay
    );
  }

  async getRecentAttendances(limit: number): Promise<(Attendance & { student: Student, course: Course })[]> {
    const allAttendances = Array.from(this.attendances.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return allAttendances.map(attendance => {
      const student = this.students.get(attendance.studentId);
      const course = this.courses.get(attendance.courseId);
      
      if (!student || !course) {
        throw new Error("Referenced student or course not found");
      }
      
      return {
        ...attendance,
        student,
        course
      };
    });
  }
}

export const storage = new MemStorage();

// Initialize with sample data
(async () => {
  // Create some courses
  const cs101 = await storage.createCourse({
    code: "CS101",
    name: "Computer Science 101",
    instructorId: 1,
    room: "Room 305B",
    schedule: "Monday, Wednesday 2:30 PM",
    totalStudents: 35
  });
  
  const dataStructures = await storage.createCourse({
    code: "CS201",
    name: "Data Structures",
    instructorId: 1,
    room: "Lab 201",
    schedule: "Tuesday, Thursday 10:15 AM",
    totalStudents: 28
  });
  
  const database = await storage.createCourse({
    code: "CS301",
    name: "Database Systems",
    instructorId: 1,
    room: "Room 112A",
    schedule: "Wednesday, Friday 11:05 AM",
    totalStudents: 42
  });
  
  const ai = await storage.createCourse({
    code: "CS401",
    name: "Artificial Intelligence",
    instructorId: 1,
    room: "Room 202C",
    schedule: "Monday, Thursday 1:30 PM",
    totalStudents: 30
  });
  
  // Create some students
  const michael = await storage.createStudent({
    name: "Michael Roberts",
    studentId: "S12345",
    email: "michael.roberts@example.com",
    courses: ["CS101", "CS201"],
    faceDescriptor: null
  });
  
  const sarah = await storage.createStudent({
    name: "Sarah Johnson",
    studentId: "S12346",
    email: "sarah.johnson@example.com",
    courses: ["CS101", "CS301"],
    faceDescriptor: null
  });
  
  const david = await storage.createStudent({
    name: "David Wilson",
    studentId: "S12347",
    email: "david.wilson@example.com",
    courses: ["CS201", "CS301"],
    faceDescriptor: null
  });
  
  const emily = await storage.createStudent({
    name: "Emily Chen",
    studentId: "S12348",
    email: "emily.chen@example.com",
    courses: ["CS101", "CS401"],
    faceDescriptor: null
  });
  
  // Create some attendance records
  const today = new Date();
  
  await storage.createAttendance({
    studentId: michael.id,
    courseId: cs101.id,
    date: new Date(today.setHours(9, 30)),
    status: "present",
    verificationMethod: "face"
  });
  
  await storage.createAttendance({
    studentId: sarah.id,
    courseId: dataStructures.id,
    date: new Date(today.setHours(10, 15)),
    status: "present",
    verificationMethod: "face"
  });
  
  await storage.createAttendance({
    studentId: david.id,
    courseId: database.id,
    date: new Date(today.setHours(11, 5)),
    status: "absent",
    verificationMethod: "manual"
  });
  
  await storage.createAttendance({
    studentId: emily.id,
    courseId: ai.id,
    date: new Date(today.setHours(13, 30)),
    status: "late",
    verificationMethod: "face"
  });
})();
