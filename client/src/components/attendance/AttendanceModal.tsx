import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Fingerprint, X } from "lucide-react";
import FaceRecognition from "./FaceRecognition";
import { Course } from "@shared/schema";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AttendanceModal({ open, onClose }: AttendanceModalProps) {
  const { t } = useTranslation();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [verificationMethod, setVerificationMethod] = useState<"face" | "fingerprint">("face");
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: open,
  });

  const handleStartVerification = () => {
    if (verificationMethod === "face") {
      setShowFaceRecognition(true);
    } else {
      // In a real app, this would trigger fingerprint verification
      // which is not implemented in this example
      alert(t("fingerPrintNotImplemented"));
    }
  };

  const handleAttendanceSuccess = () => {
    setShowFaceRecognition(false);
    onClose();
  };

  const handleCancel = () => {
    setShowFaceRecognition(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("takeAttendanceBtn")}</DialogTitle>
        </DialogHeader>
        
        {!showFaceRecognition ? (
          <>
            <div className="mb-5">
              <Label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                {t("selectCourse")}
              </Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger id="course" className="w-full">
                  <SelectValue placeholder={t("selectCourse")} />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-5">
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                {t("verificationMethodType")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={verificationMethod === "face" ? "default" : "outline"}
                  className={`p-3 flex flex-col items-center h-auto ${
                    verificationMethod === "face" ? "bg-primary/5 text-primary" : ""
                  }`}
                  onClick={() => setVerificationMethod("face")}
                >
                  <Camera className="h-6 w-6 mb-2" />
                  <span className="text-sm">{t("faceId")}</span>
                </Button>
                <Button
                  type="button"
                  variant={verificationMethod === "fingerprint" ? "default" : "outline"}
                  className={`p-3 flex flex-col items-center h-auto ${
                    verificationMethod === "fingerprint" ? "bg-primary/5 text-primary" : ""
                  }`}
                  onClick={() => setVerificationMethod("fingerprint")}
                >
                  <Fingerprint className="h-6 w-6 mb-2" />
                  <span className="text-sm">{t("fingerprint")}</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleStartVerification}
                disabled={!selectedCourse}
              >
                {t("startScanning")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <FaceRecognition
            studentId={1} // This would normally come from selecting a student
            courseId={parseInt(selectedCourse)}
            onSuccess={handleAttendanceSuccess}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
