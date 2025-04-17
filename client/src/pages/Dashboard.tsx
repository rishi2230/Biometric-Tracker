import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AttendanceStats from "@/components/attendance/AttendanceStats";
import AttendanceChart from "@/components/attendance/AttendanceChart";
import CourseAttendance from "@/components/attendance/CourseAttendance";
import RecentAttendanceTable from "@/components/tables/RecentAttendanceTable";
import UpcomingClassesTable from "@/components/tables/UpcomingClassesTable";
import AttendanceModal from "@/components/attendance/AttendanceModal";

export default function Dashboard() {
  const { t } = useTranslation();
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t("dashboard")}</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setAttendanceModalOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            {t("takeAttendance")}
          </Button>
        </div>
      </div>

      <AttendanceStats />

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AttendanceChart />
        <CourseAttendance />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RecentAttendanceTable />
        <UpcomingClassesTable />
      </div>

      <AttendanceModal 
        open={attendanceModalOpen} 
        onClose={() => setAttendanceModalOpen(false)} 
      />
    </div>
  );
}
