import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Book, FlaskRound, Database, Cpu } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseAttendanceStats {
  id: number;
  name: string;
  code: string;
  percentage: number;
}

// Course icons mapping
const getCourseIcon = (code: string) => {
  if (code.startsWith('CS1')) return <Book className="h-6 w-6" />;
  if (code.startsWith('CS2')) return <FlaskRound className="h-6 w-6" />;
  if (code.startsWith('CS3')) return <Database className="h-6 w-6" />;
  return <Cpu className="h-6 w-6" />;
};

// Color mapping based on attendance percentage
const getColorClass = (percentage: number) => {
  if (percentage >= 90) return "bg-green-600";
  if (percentage >= 75) return "bg-primary";
  if (percentage >= 60) return "bg-amber-500";
  return "bg-red-500";
};

export default function CourseAttendance() {
  const { t } = useTranslation();
  
  const { data: courses, isLoading } = useQuery<CourseAttendanceStats[]>({
    queryKey: ['/api/dashboard/course-stats'],
  });

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("attendanceByCourse")}</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("attendanceByCourse")}</h3>
      <div className="space-y-4">
        {courses?.map((course) => (
          <div key={course.id} className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {getCourseIcon(course.code)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">{course.name}</h4>
                <span className="text-sm font-semibold">{course.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`${getColorClass(course.percentage)} h-1.5 rounded-full`} 
                  style={{ width: `${course.percentage}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
