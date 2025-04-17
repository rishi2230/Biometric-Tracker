import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceRecord {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: "present" | "absent" | "late";
  verificationMethod: string;
  student: {
    id: number;
    name: string;
    studentId: string;
  };
  course: {
    id: number;
    name: string;
    code: string;
  };
}

export default function RecentAttendanceTable() {
  const { t } = useTranslation();
  
  const { data: recentAttendance, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/recent', { limit: 5 }],
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "present":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{t("present")}</Badge>;
      case "absent":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{t("absent")}</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t("late")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t("recentAttendance")}</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("student")}</TableHead>
                <TableHead>{t("course")}</TableHead>
                <TableHead>{t("time")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-3" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t("recentAttendance")}</h3>
        <a href="/attendance" className="text-primary text-sm hover:underline">{t("viewAll")}</a>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("student")}</TableHead>
              <TableHead>{t("course")}</TableHead>
              <TableHead>{t("time")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentAttendance?.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {record.student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium text-gray-900">
                      {record.student.name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {record.course.code}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(record.date), "h:mm a")}
                </TableCell>
                <TableCell>
                  {getStatusBadge(record.status)}
                </TableCell>
              </TableRow>
            ))}
            
            {(!recentAttendance || recentAttendance.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  {t("noRecentAttendance")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
