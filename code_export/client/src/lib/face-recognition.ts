import * as faceapi from "face-api.js";

// Define the path to face-api models
const MODEL_URL = '/models';

// Flag to prevent multiple loading attempts
let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load face-api.js models from CDN
 * This needs to be called before using any face recognition features
 */
export const loadFaceApiModels = async (): Promise<void> => {
  if (modelsLoaded) {
    return;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Load models from CDN (using jsdelivr as a CDN for the models)
      const tinyFaceDetectorUrl = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/tiny_face_detector_model-weights_manifest.json';
      const faceLandmarkUrl = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_landmark_68_model-weights_manifest.json';
      const faceRecognitionUrl = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_recognition_model-weights_manifest.json';
      
      // Load the models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(tinyFaceDetectorUrl.replace('_manifest.json', '')),
        faceapi.nets.faceLandmark68Net.loadFromUri(faceLandmarkUrl.replace('_manifest.json', '')),
        faceapi.nets.faceRecognitionNet.loadFromUri(faceRecognitionUrl.replace('_manifest.json', '')),
      ]);
      
      modelsLoaded = true;
      console.log("Face-api.js models loaded successfully");
    } catch (error) {
      console.error("Error loading face-api.js models:", error);
      throw error;
    }
  })();

  return loadPromise;
};

/**
 * Detect faces in the provided image element
 */
export const detectFaces = async (
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.FaceDetection[]> => {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }
  
  return faceapi.detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions());
};

/**
 * Detect faces and extract face descriptors (numerical representations of faces)
 * These can be used for face recognition/comparison
 */
export const getFaceDescriptors = async (
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{detection: faceapi.FaceDetection}, faceapi.FaceLandmarks68>>[]> => {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }
  
  return faceapi
    .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
};

/**
 * Compare a face descriptor with a list of known face descriptors
 * Returns the best match and the distance (lower is better)
 */
export const findBestMatch = (
  faceDescriptor: Float32Array,
  knownDescriptors: Array<{ studentId: number, descriptor: Float32Array }>
): { studentId: number, distance: number } | null => {
  if (knownDescriptors.length === 0) {
    return null;
  }
  
  let bestMatch = {
    studentId: -1,
    distance: Number.MAX_VALUE
  };
  
  for (const known of knownDescriptors) {
    const distance = faceapi.euclideanDistance(faceDescriptor, known.descriptor);
    if (distance < bestMatch.distance) {
      bestMatch = {
        studentId: known.studentId,
        distance
      };
    }
  }
  
  // Threshold for positive recognition (adjust as needed)
  const MATCH_THRESHOLD = 0.6;
  
  if (bestMatch.distance <= MATCH_THRESHOLD) {
    return bestMatch;
  }
  
  return null;
};

/**
 * Draw detection results on a canvas
 */
export const drawDetections = (
  canvas: HTMLCanvasElement,
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  detections: faceapi.FaceDetection[]
): void => {
  const displaySize = {
    width: imageElement.width,
    height: imageElement.height
  };
  
  faceapi.matchDimensions(canvas, displaySize);
  
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  faceapi.draw.drawDetections(canvas, resizedDetections);
};
