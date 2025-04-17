import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart2, 
  Settings,
  LogOut
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const navItems = [
    { path: "/", label: t("dashboard"), icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/students", label: t("students"), icon: <Users className="h-5 w-5 mr-3" /> },
    { path: "/courses", label: t("courses"), icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { path: "/attendance", label: t("attendance"), icon: <FileText className="h-5 w-5 mr-3" /> },
    { path: "/reports", label: t("reports"), icon: <BarChart2 className="h-5 w-5 mr-3" /> },
    { path: "/settings", label: t("settings"), icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    
    try {
      await apiRequest("PATCH", "/api/user/language", { language: value });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorChangingLanguage"),
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: t("error"),
        description: t("errorLoggingOut"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-[#1F2937] text-white">
      <div className="p-4 flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h1 className="text-xl font-semibold">BiometricAttend</h1>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-2 rounded-md ${
                location === item.path
                  ? "bg-primary text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="bg-gray-700 text-white border-none focus:ring-primary focus:border-primary w-full">
              <SelectValue placeholder={t("selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-white">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-gray-300">{user?.department}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
