import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AttendanceData {
  name: string;
  attendance: number;
}

// Sample data - in a real app, this would come from an API
const weekData: AttendanceData[] = [
  { name: "Mon", attendance: 60 },
  { name: "Tue", attendance: 85 },
  { name: "Wed", attendance: 75 },
  { name: "Thu", attendance: 90 },
  { name: "Fri", attendance: 70 },
  { name: "Sat", attendance: 40 },
  { name: "Sun", attendance: 30 },
];

const monthData: AttendanceData[] = [
  { name: "Week 1", attendance: 75 },
  { name: "Week 2", attendance: 82 },
  { name: "Week 3", attendance: 88 },
  { name: "Week 4", attendance: 79 },
];

const semesterData: AttendanceData[] = [
  { name: "Jan", attendance: 70 },
  { name: "Feb", attendance: 75 },
  { name: "Mar", attendance: 80 },
  { name: "Apr", attendance: 85 },
  { name: "May", attendance: 78 },
];

export default function AttendanceChart() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("week");
  
  const chartData = timeRange === "week" 
    ? weekData 
    : timeRange === "month" 
      ? monthData 
      : semesterData;

  return (
    <div className="bg-white p-5 rounded-lg shadow lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t("attendanceTrends")}</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("selectTimeRange")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t("last7days")}</SelectItem>
            <SelectItem value="month">{t("last30days")}</SelectItem>
            <SelectItem value="semester">{t("thisSemester")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, t("attendance")]}
              labelFormatter={(label) => `${label}`}
            />
            <Bar 
              dataKey="attendance" 
              fill="hsl(234, 85%, 59%)" 
              radius={[4, 4, 0, 0]}
              barSize={timeRange === "week" ? 30 : 40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
