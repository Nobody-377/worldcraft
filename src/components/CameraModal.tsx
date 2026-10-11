"use client";

import React, { useEffect, useRef, useState } from "react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, filename: string) => void;
}

function CameraViewfinder({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (blob: Blob, filename: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stop all active camera tracks safely
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser environment.");
        }

        // Request rear-facing camera first on mobile devices, fallback to any available camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMounted) {
              videoRef.current?.play().catch(console.warn);
              setIsLoading(false);
            }
          };
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsLoading(false);
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setErrorMessage(
            "Camera permission was denied. Please allow camera access in your browser settings."
          );
        } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setErrorMessage("No camera hardware was detected on your device.");
        } else {
          setErrorMessage(err instanceof Error ? err.message : "Unable to access camera.");
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, 19);
          const filename = `photo-capture-${timestamp}.jpg`;
          stopStream();
          onCapture(blob, filename);
          onClose();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] bg-[#E8E8DA] rounded-3xl border-3 border-[#171D1B] shadow-[4px_4px_0px_#171D1B] overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b-2 border-[#171D1B] flex items-center justify-between bg-[#3D5E59]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5BD2D] border-2 border-[#171D1B] text-[#171D1B] flex items-center justify-center shadow-[1px_1px_0px_#171D1B]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold font-mono uppercase text-[#E8E8DA]">
                Capture Object
              </h3>
              <p className="text-[10px] text-[#E8E8DA]/80 font-medium">Snap real-world elements for your canvas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-[#E8E8DA] border-2 border-[#171D1B] text-[#171D1B] font-black flex items-center justify-center shadow-[1px_1px_0px_#171D1B] retro-press transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative w-full aspect-4/3 bg-black flex items-center justify-center overflow-hidden border-b-2 border-[#171D1B]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#E8E8DA] text-xs font-mono font-bold">
              <span className="w-6 h-6 border-3 border-[#E8E8DA]/30 border-t-[#F5BD2D] rounded-full animate-spin" />
              <span>CONNECTING CAMERA...</span>
            </div>
          )}

          {errorMessage ? (
            <div className="p-6 text-center max-w-sm text-white flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E98083] border-2 border-[#171D1B] text-[#171D1B] flex items-center justify-center shadow-[2px_2px_0px_#171D1B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-medium">{errorMessage}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#E8E8DA] border-2 border-[#171D1B] text-xs font-bold text-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press"
              >
                Close & Use Photo Upload
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Viewfinder Center Crosshair with Retro Arcade Accents */}
          {!errorMessage && !isLoading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-36 h-36 border-2 border-dashed border-[#F5BD2D] rounded-2xl shadow-xs" />
            </div>
          )}
        </div>

        {/* Modal Footer / 44px Touch Targets */}
        <div className="p-3.5 sm:p-4 bg-[#E8E8DA] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold font-mono text-[#171D1B] bg-[#FAF9F0] border-2 border-[#171D1B] shadow-[1px_1px_0px_#171D1B] retro-press transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isLoading || !!errorMessage}
            onClick={handleCapture}
            className="min-h-[44px] flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-2xl bg-[#F5BD2D] hover:bg-[#ffcb47] text-[#171D1B] text-xs font-mono font-black uppercase border-2 border-[#171D1B] shadow-[2px_2px_0px_#171D1B] retro-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#E98083] animate-pulse" />
            <span>Snap & Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  if (!isOpen) return null;
  return <CameraViewfinder onClose={onClose} onCapture={onCapture} />;
}
