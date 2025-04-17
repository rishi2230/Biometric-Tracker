import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Camera, UserCheck, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as faceapi from "face-api.js";
import { loadFaceApiModels } from "@/lib/face-recognition";

interface FaceRecognitionProps {
  studentId: number;
  courseId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaceRecognition({ 
  studentId, 
  courseId, 
  onSuccess,
  onCancel 
}: FaceRecognitionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await loadFaceApiModels();
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models:", error);
        toast({
          title: t("error"),
          description: t("errorLoadingFaceModels"),
          variant: "destructive",
        });
      }
    };
    
    loadModels();
    
    return () => {
      // Clean up video stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [t, toast]);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access not supported by browser");
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsCapturing(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: t("error"),
        description: t("errorAccessingCamera"),
        variant: "destructive",
      });
    }
  }, [t, toast]);

  // Face detection loop
  useEffect(() => {
    let animationFrame: number;
    
    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded || !isCapturing) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrame = requestAnimationFrame(detectFace);
        return;
      }
      
      faceapi.matchDimensions(canvas, displaySize);
      
      try {
        const detections = await faceapi.detectAllFaces(
          video, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        
        setFaceDetected(detections.length > 0);
      } catch (e) {
        console.error("Face detection error:", e);
      }
      
      animationFrame = requestAnimationFrame(detectFace);
    };
    
    if (isCapturing) {
      animationFrame = requestAnimationFrame(detectFace);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isCapturing, modelsLoaded]);

  // Capture face and verify attendance
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current || !faceDetected || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          }
        }, 'image/jpeg');
      });
      
      // Create form data to send to server
      const formData = new FormData();
      formData.append('faceImage', blob, 'face.jpg');
      formData.append('studentId', studentId.toString());
      formData.append('courseId', courseId.toString());
      
      // Send to server for verification
      const response = await fetch('/api/attendance/verify-face', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      toast({
        title: t("success"),
        description: t("attendanceRecorded"),
        variant: "default",
      });
      
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error capturing face:", error);
      toast({
        title: t("error"),
        description: t("errorRecordingAttendance"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCapturing(false);
    onCancel();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
        {!isCapturing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startCamera} variant="outline" className="bg-gray-100">
              <Camera className="h-16 w-16 text-gray-400" />
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              {faceDetected && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <UserCheck className="w-4 h-4 mr-1" />
                  {t("faceDetected")}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {isCapturing
          ? faceDetected
            ? t("facePositioned")
            : t("positionFace")
          : t("startCamera")}
      </p>
      
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={stopCamera}
          disabled={isProcessing}
        >
          {t("cancel")}
        </Button>
        
        <Button
          onClick={captureFace}
          disabled={!isCapturing || !faceDetected || isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("processing")}
            </>
          ) : (
            t("takePicture")
          )}
        </Button>
      </div>
    </div>
  );
}
