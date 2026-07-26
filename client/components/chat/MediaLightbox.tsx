"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Maximize, ZoomIn, FileText, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@lib/api";
import { useAuthStore } from "@hooks/useAuthStore";

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "PDF";
  fileName?: string;
}

export function MediaLightbox({ isOpen, onClose, mediaUrl, mediaType, fileName = "File" }: MediaLightboxProps) {
  const token = useAuthStore((state) => state.token);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Reset loading status when mediaUrl changes
  useEffect(() => {
    setIframeLoading(true);
  }, [mediaUrl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Proxy download to retain original filename and extension
    const downloadUrl = `${API_BASE_URL}/media/download?url=${encodeURIComponent(mediaUrl)}&name=${encodeURIComponent(fileName)}`;
    window.location.href = downloadUrl;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 select-none p-4 md:p-6 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 text-white z-50">
        <div className="flex items-center gap-2 min-w-0">
          {mediaType === "PDF" && <FileText size={18} className="text-zinc-500 flex-shrink-0" />}
          <span className="text-base font-bold truncate max-w-xs md:max-w-md drop-shadow-md">{fileName}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-zinc-200 hover:text-white transition-all duration-200 cursor-pointer backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg"
            title="Download file"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-zinc-200 hover:text-white transition-all duration-200 cursor-pointer backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="w-full flex-1 flex items-center justify-center relative overflow-hidden mt-10"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === "IMAGE" && (
          <img
            src={mediaUrl}
            alt={fileName}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-up select-none pointer-events-none"
          />
        )}

        {mediaType === "VIDEO" && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-up"
          />
        )}

        {mediaType === "PDF" && (
          <div className="w-full h-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#1f2c34]/50 backdrop-blur-md p-1.5 animate-scale-up relative">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1f2c34]/80 text-white gap-2 rounded-xl z-20">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
                <span className="text-base font-semibold">Loading document...</span>
              </div>
            )}
            <iframe
              src={mediaUrl}
              onLoad={() => setIframeLoading(false)}
              className="w-full h-full border-none rounded-xl bg-white select-text"
              title={fileName}
            />
          </div>
        )}
      </div>

    </div>,
    document.body
  );
}
