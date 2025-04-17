import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { loginSchema, insertStudentSchema, insertCourseSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { createObjectCsvStringifier } from 'csv-writer';
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "attendance-tracking-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    })
  );

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId as number);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.patch("/api/user/language", authenticate, async (req, res) => {
    try {
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: "Language is required" });
      }
      
      const userId = req.session.userId as number;
      const updatedUser = await storage.updateUserLanguage(userId, language);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Student routes
  app.get("/api/students", authenticate, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/students/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json(student);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students", authenticate, async (req, res) => {
    try {
      const student = insertStudentSchema.parse(req.body);
      const newStudent = await storage.createStudent(student);
      return res.status(201).json(newStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/students/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedStudent = await storage.updateStudent(id, updates);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json(updatedStudent);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/students/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStudent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Course routes
  app.get("/api/courses", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const courses = await storage.getCoursesByInstructor(userId);
      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/courses/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      return res.status(200).json(course);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/courses", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const courseData = { ...req.body, instructorId: userId };
      
      const course = insertCourseSchema.parse(courseData);
      const newCourse = await storage.createCourse(course);
      
      return res.status(201).json(newCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/courses/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedCourse = await storage.updateCourse(id, updates);
      
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      return res.status(200).json(updatedCourse);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/courses/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCourse(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/courses/:id/students", authenticate, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const students = await storage.getStudentsByCourse(courseId);
      
      return res.status(200).json(students);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendance routes
  app.post("/api/attendance", authenticate, async (req, res) => {
    try {
      const attendance = insertAttendanceSchema.parse(req.body);
      const newAttendance = await storage.createAttendance(attendance);
      
      return res.status(201).json(newAttendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/course/:courseId", authenticate, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const attendances = await storage.getAttendancesByCourse(courseId);
      
      return res.status(200).json(attendances);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/student/:studentId", authenticate, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendances = await storage.getAttendancesByStudent(studentId);
      
      return res.status(200).json(attendances);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/recent", authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recentAttendances = await storage.getRecentAttendances(limit);
      
      return res.status(200).json(recentAttendances);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const courses = await storage.getCoursesByInstructor(userId);
      const students = await storage.getAllStudents();
      
      // Calculate total students
      const totalStudents = students.length;
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate today's attendance
      let presentToday = 0;
      let totalToday = 0;
      
      for (const course of courses) {
        const attendances = await storage.getAttendancesByDate(course.id, today);
        totalToday += attendances.length;
        presentToday += attendances.filter(a => a.status === "present").length;
      }
      
      // Calculate weekly average (simplified for this example)
      const weeklyAverage = 87; // This would normally be calculated based on real data
      
      return res.status(200).json({
        todayAttendance: `${presentToday}/${totalToday}`,
        todayPercentage: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0,
        weeklyAverage: weeklyAverage,
        totalStudents: totalStudents,
        courseCount: courses.length
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Course attendance stats
  app.get("/api/dashboard/course-stats", authenticate, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const courses = await storage.getCoursesByInstructor(userId);
      
      const courseStats = await Promise.all(courses.map(async (course) => {
        const attendances = await storage.getAttendancesByCourse(course.id);
        const totalCount = attendances.length;
        const presentCount = attendances.filter(a => a.status === "present").length;
        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        
        return {
          id: course.id,
          name: course.name,
          code: course.code,
          percentage
        };
      }));
      
      return res.status(200).json(courseStats);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Export attendance data as CSV
  app.get("/api/reports/export/:courseId", authenticate, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const attendances = await storage.getAttendancesByCourse(courseId);
      const students = await storage.getStudentsByCourse(courseId);
      
      // Map student ids to names for the report
      const studentMap = new Map(students.map(s => [s.id, s]));
      
      // Create CSV data
      const records = attendances.map(attendance => {
        const student = studentMap.get(attendance.studentId);
        return {
          date: format(new Date(attendance.date), "yyyy-MM-dd HH:mm:ss"),
          studentId: student?.studentId || "Unknown",
          studentName: student?.name || "Unknown",
          course: course.name,
          status: attendance.status,
          verificationMethod: attendance.verificationMethod
        };
      });
      
      // Generate CSV string
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'date', title: 'Date' },
          { id: 'studentId', title: 'Student ID' },
          { id: 'studentName', title: 'Student Name' },
          { id: 'course', title: 'Course' },
          { id: 'status', title: 'Status' },
          { id: 'verificationMethod', title: 'Verification Method' }
        ]
      });
      
      const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${course.code}_${format(new Date(), 'yyyy-MM-dd')}.csv"`);
      
      return res.status(200).send(csvString);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Face recognition routes
  app.post("/api/students/:id/face", authenticate, upload.single("faceImage"), async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // In a real implementation, we would process the uploaded face image
      // and extract a face descriptor to store. For this example, we'll just
      // simulate storing some face descriptor data.
      
      const faceDescriptor = req.body.faceDescriptor ? JSON.parse(req.body.faceDescriptor) : [];
      
      const updatedStudent = await storage.updateStudent(studentId, {
        faceDescriptor
      });
      
      return res.status(200).json(updatedStudent);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendance/verify-face", authenticate, upload.single("faceImage"), async (req, res) => {
    try {
      const { studentId, courseId } = req.body;
      
      if (!studentId || !courseId) {
        return res.status(400).json({ message: "Student ID and Course ID are required" });
      }
      
      // In a real implementation, we would compare the uploaded face with
      // the stored face descriptor for the student. For this example, we'll
      // just simulate a successful verification.
      
      const attendance = {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        date: new Date(),
        status: "present",
        verificationMethod: "face"
      };
      
      const newAttendance = await storage.createAttendance(attendance);
      
      return res.status(201).json(newAttendance);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
