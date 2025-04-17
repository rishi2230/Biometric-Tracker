import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Course } from "@shared/schema";

export default function UpcomingClassesTable() {
  const { t } = useTranslation();
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // In a real app, this would be filtered to only show upcoming classes
  // For this example, we'll just show all courses
  
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t("upcomingClasses")}</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border rounded-md border-gray-200">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="mt-2">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t("upcomingClasses")}</h3>
        <a href="/courses" className="text-primary text-sm hover:underline">{t("viewSchedule")}</a>
      </div>
      <div className="space-y-4">
        {courses?.slice(0, 3).map((course) => (
          <div key={course.id} className="p-3 border rounded-md border-gray-200 hover:border-primary transition-colors">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium text-gray-800">{course.name}</h4>
                <p className="text-sm text-gray-500">{course.room}</p>
              </div>
              <div className="text-right">
                <span className="text-primary font-semibold">
                  {course.schedule?.split(" ").pop() || ""}
                </span>
                <p className="text-sm text-gray-500">{t("today")}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1 text-gray-400" />
              <span>{course.totalStudents} {t("students")}</span>
            </div>
          </div>
        ))}
        
        {(!courses || courses.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            {t("noUpcomingClasses")}
          </div>
        )}

        <Button 
          variant="ghost" 
          className="w-full py-2 bg-gray-100 text-primary hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
          onClick={() => window.location.href = "/courses/new"}
        >
          + {t("addNewClass")}
        </Button>
      </div>
    </div>
  );
}
