import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, BarChart2, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  todayAttendance: string;
  todayPercentage: number;
  weeklyAverage: number;
  totalStudents: number;
  courseCount: number;
}

export default function AttendanceStats() {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="mt-5">
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-4 w-20 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{t("todaysAttendance")}</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.todayAttendance || '0/0'}</h3>
          </div>
          <div className="bg-green-100 rounded-full p-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <Progress value={stats?.todayPercentage || 0} className="h-2.5" />
          <p className="text-gray-600 text-sm mt-1">
            {stats?.todayPercentage || 0}% {t("present")}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{t("weeklyAverage")}</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.weeklyAverage || 0}%</h3>
          </div>
          <div className="bg-blue-100 rounded-full p-2">
            <BarChart2 className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-2">
          <Progress value={stats?.weeklyAverage || 0} className="h-2.5" />
          <p className="text-gray-600 text-sm mt-1">
            +2% {t("fromLastWeek")}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{t("totalStudents")}</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.totalStudents || 0}</h3>
          </div>
          <div className="bg-amber-100 rounded-full p-2">
            <Users className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="mt-2">
          <Progress value={100} className="h-2.5" />
          <p className="text-gray-600 text-sm mt-1">
            {t("across")} {stats?.courseCount || 0} {t("courses")}
          </p>
        </div>
      </div>
    </div>
  );
}
