import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Course, Student } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { 
  ListChecks, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  Filter, 
  Search,
  Camera
} from "lucide-react";
import AttendanceModal from "@/components/attendance/AttendanceModal";
import FaceRecognition from "@/components/attendance/FaceRecognition";

interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: "present" | "absent" | "late";
  verificationMethod: string;
  student?: {
    id: number;
    name: string;
    studentId: string;
  };
  course?: {
    id: number;
    name: string;
    code: string;
  };
}

export default function Attendance() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [takeAttendanceOpen, setTakeAttendanceOpen] = useState(false);
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // Fetch courses
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });
  
  // Fetch students by course
  const { data: students, isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/courses', selectedCourse, 'students'],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await fetch(`/api/courses/${selectedCourse}/students`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!selectedCourse,
  });
  
  // Fetch attendance for selected course
  const { data: attendanceRecords, isLoading: loadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/course', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await fetch(`/api/attendance/course/${selectedCourse}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!selectedCourse,
  });

  // Create manual attendance records mutation
  const createAttendanceMutation = useMutation({
    mutationFn: (data: { studentIds: number[], courseId: number, status: string }) => 
      apiRequest("POST", "/api/attendance", {
        studentId: data.studentIds[0], // We'll handle multiple in a loop
        courseId: data.courseId,
        date: new Date().toISOString(),
        status: data.status,
        verificationMethod: "manual"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/course', selectedCourse] });
      setManualAttendanceOpen(false);
      setSelectedStudents([]);
      toast({
        title: t("success"),
        description: t("attendanceRecorded"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("errorRecordingAttendance"),
        variant: "destructive",
      });
    },
  });

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourse(courseId);
  };

  const handleManualAttendance = async (status: string) => {
    if (!selectedCourse || selectedStudents.length === 0) {
      toast({
        title: t("error"),
        description: t("selectStudentsFirst"),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // For each selected student, create an attendance record
      for (const studentId of selectedStudents) {
        await createAttendanceMutation.mutateAsync({
          studentIds: [studentId],
          courseId: selectedCourse,
          status
        });
      }
    } catch (error) {
      console.error("Error recording manual attendance:", error);
    }
  };

  const handleCheckboxChange = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const getAttendanceStatusForStudent = (studentId: number): string => {
    if (!attendanceRecords) return "unknown";
    
    // Check for attendance records from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const studentAttendance = attendanceRecords.find(record => 
      record.studentId === studentId && 
      new Date(record.date) >= today
    );
    
    return studentAttendance ? studentAttendance.status : "unknown";
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "present":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{t("present")}</Badge>;
      case "absent":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{t("absent")}</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t("late")}</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{t("unknown")}</Badge>;
    }
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t("attendance")}</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setTakeAttendanceOpen(true)}>
            <Camera className="h-5 w-5 mr-2" />
            {t("takeAttendanceBtn")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Course Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("courses")}</CardTitle>
            <CardDescription>{t("selectCourseToViewAttendance")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses?.map(course => (
              <Button
                key={course.id}
                variant={selectedCourse === course.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleSelectCourse(course.id)}
              >
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">{course.code}</Badge>
                  <span className="truncate">{course.name}</span>
                </div>
              </Button>
            ))}
            
            {(!courses || courses.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                {t("noCoursesYet")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Management */}
        <div className="lg:col-span-3">
          {!selectedCourse ? (
            <Card>
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <ListChecks className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">{t("noCoursSelected")}</h3>
                  <p className="text-gray-500">{t("selectCourseToManageAttendance")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="students">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="students">{t("students")}</TabsTrigger>
                  <TabsTrigger value="records">{t("attendanceRecords")}</TabsTrigger>
                </TabsList>
                
                {manualAttendanceOpen && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManualAttendance("present")}
                      disabled={selectedStudents.length === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      {t("markPresent")}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManualAttendance("late")}
                      disabled={selectedStudents.length === 0}
                    >
                      <Clock className="h-4 w-4 mr-1 text-yellow-600" />
                      {t("markLate")}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManualAttendance("absent")}
                      disabled={selectedStudents.length === 0}
                    >
                      <XCircle className="h-4 w-4 mr-1 text-red-600" />
                      {t("markAbsent")}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setManualAttendanceOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                )}
                
                {!manualAttendanceOpen && (
                  <Button 
                    variant="outline"
                    onClick={() => setManualAttendanceOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("manualAttendance")}
                  </Button>
                )}
              </div>
              
              <TabsContent value="students" className="mt-0">
                <Card>
                  <CardContent className="p-0">
                    {loadingStudents ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">{t("loadingStudents")}</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {manualAttendanceOpen && (
                              <TableHead className="w-[50px]"></TableHead>
                            )}
                            <TableHead>{t("name")}</TableHead>
                            <TableHead>{t("studentId")}</TableHead>
                            <TableHead>{t("todaysStatus")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students?.map((student) => (
                            <TableRow key={student.id}>
                              {manualAttendanceOpen && (
                                <TableCell>
                                  <Checkbox
                                    checked={selectedStudents.includes(student.id)}
                                    onCheckedChange={(checked) => 
                                      handleCheckboxChange(student.id, !!checked)
                                    }
                                  />
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{student.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{student.studentId}</TableCell>
                              <TableCell>
                                {getStatusBadge(getAttendanceStatusForStudent(student.id))}
                              </TableCell>
                            </TableRow>
                          ))}

                          {(!students || students.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={manualAttendanceOpen ? 4 : 3} className="text-center py-6 text-gray-500">
                                {t("noStudentsInCourse")}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="records" className="mt-0">
                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center">
                      <CardTitle>{t("attendanceRecords")}</CardTitle>
                      {/* Filter controls could go here */}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingAttendance ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-500">{t("loadingAttendance")}</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("date")}</TableHead>
                            <TableHead>{t("studentId")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("verificationMethodUsed")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords?.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {format(new Date(record.date), "PPP p")}
                              </TableCell>
                              <TableCell>
                                {students?.find(s => s.id === record.studentId)?.studentId || record.studentId}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(record.status)}
                              </TableCell>
                              <TableCell>
                                {record.verificationMethod === "face" ? (
                                  <span className="flex items-center">
                                    <Camera className="h-4 w-4 mr-1 text-primary" />
                                    {t("faceId")}
                                  </span>
                                ) : (
                                  <span>{t("manual")}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}

                          {(!attendanceRecords || attendanceRecords.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                {t("noAttendanceRecords")}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <AttendanceModal 
        open={takeAttendanceOpen} 
        onClose={() => setTakeAttendanceOpen(false)} 
      />
    </div>
  );
}

// Internal component to prevent import errors
interface IconProps {
  className?: string;
}

const BookOpen = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
