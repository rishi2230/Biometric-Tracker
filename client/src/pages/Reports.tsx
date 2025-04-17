import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Calendar, 
  FileDown, 
  BarChart2, 
  PieChart as PieChartIcon,
  Filter
} from "lucide-react";
import { format } from "date-fns";

// Colors for charts
const COLORS = ["#4F46E5", "#22C55E", "#F59E0B", "#EF4444"];

export default function Reports() {
  const { t } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("week");
  const [chartType, setChartType] = useState<string>("bar");

  // Fetch courses
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Sample data for attendance overview
  const getAttendanceData = () => {
    if (dateRange === "week") {
      return [
        { name: t("monday"), present: 45, absent: 5, late: 3 },
        { name: t("tuesday"), present: 48, absent: 2, late: 3 },
        { name: t("wednesday"), present: 42, absent: 6, late: 5 },
        { name: t("thursday"), present: 46, absent: 3, late: 4 },
        { name: t("friday"), present: 40, absent: 8, late: 5 },
      ];
    } else if (dateRange === "month") {
      return [
        { name: t("week1"), present: 210, absent: 25, late: 15 },
        { name: t("week2"), present: 220, absent: 18, late: 12 },
        { name: t("week3"), present: 215, absent: 22, late: 13 },
        { name: t("week4"), present: 225, absent: 15, late: 10 },
      ];
    } else {
      return [
        { name: t("jan"), present: 850, absent: 100, late: 50 },
        { name: t("feb"), present: 900, absent: 80, late: 45 },
        { name: t("mar"), present: 880, absent: 90, late: 55 },
        { name: t("apr"), present: 910, absent: 70, late: 40 },
        { name: t("may"), present: 930, absent: 60, late: 35 },
      ];
    }
  };

  // Data for pie chart
  const getPieData = () => {
    const totals = getAttendanceData().reduce(
      (acc, day) => {
        acc.present += day.present;
        acc.absent += day.absent;
        acc.late += day.late;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );

    return [
      { name: t("present"), value: totals.present },
      { name: t("absent"), value: totals.absent },
      { name: t("late"), value: totals.late },
    ];
  };

  const handleExportCSV = () => {
    if (!selectedCourse) return;
    
    // Create URL for downloading CSV
    const downloadUrl = `/api/reports/export/${selectedCourse}`;
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t("reports")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{t("attendanceReports")}</CardTitle>
            <CardDescription>{t("viewAndExportAttendanceData")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("selectCourse")}
                </label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="course-select">
                    <SelectValue placeholder={t("selectCourse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("timeRange")}
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-range" className="min-w-[150px]">
                    <SelectValue placeholder={t("selectRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">{t("lastWeek")}</SelectItem>
                    <SelectItem value="month">{t("lastMonth")}</SelectItem>
                    <SelectItem value="semester">{t("semester")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="chart-type" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("chartType")}
                </label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger id="chart-type" className="min-w-[150px]">
                    <SelectValue placeholder={t("selectChartType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">{t("barChart")}</SelectItem>
                    <SelectItem value="pie">{t("pieChart")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={!selectedCourse}
                  className="flex items-center"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {t("exportCSV")}
                </Button>
              </div>
            </div>
            
            {!selectedCourse ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">{t("noDataToDisplay")}</h3>
                <p className="text-gray-500">{t("selectCourseToViewReports")}</p>
              </div>
            ) : (
              <div className="w-full h-[400px]">
                {chartType === "bar" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getAttendanceData()}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill={COLORS[0]} name={t("present")} />
                      <Bar dataKey="absent" fill={COLORS[3]} name={t("absent")} />
                      <Bar dataKey="late" fill={COLORS[2]} name={t("late")} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-gray-500">
            {t("reportFooterNote")}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("attendanceSummary")}</CardTitle>
            <CardDescription>
              {selectedCourse && courses
                ? t("summaryFor") + " " + courses.find(c => c.id.toString() === selectedCourse)?.name
                : t("summaryDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedCourse ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t("selectCourseToViewSummary")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <div className="bg-primary/20 h-12 w-12 flex items-center justify-center rounded-full mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">{getPieData()[0].value}</h3>
                  <p className="text-gray-700">{t("totalPresent")}</p>
                </div>
                
                <div className="bg-red-100 rounded-lg p-6 text-center">
                  <div className="bg-red-200 h-12 w-12 flex items-center justify-center rounded-full mx-auto mb-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600">{getPieData()[1].value}</h3>
                  <p className="text-gray-700">{t("totalAbsent")}</p>
                </div>
                
                <div className="bg-yellow-100 rounded-lg p-6 text-center">
                  <div className="bg-yellow-200 h-12 w-12 flex items-center justify-center rounded-full mx-auto mb-3">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-600">{getPieData()[2].value}</h3>
                  <p className="text-gray-700">{t("totalLate")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Internal components to prevent import errors
const CheckCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
