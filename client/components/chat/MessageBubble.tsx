import * as React from "react";
import { useState } from "react";
import { Download, FileText, Play, Loader2, AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@lib/utils";
import { useAuthStore } from "@hooks/useAuthStore";
import { useChatStore } from "@hooks/useChatStore";
import { Avatar } from "@components/ui/Avatar";
import { API_BASE_URL } from "@lib/api";
import { CustomAudioPlayer } from "./CustomAudioPlayer";
import { MediaLightbox } from "./MediaLightbox";

export interface MessageBubbleProps {
  message: any;
  searchQuery?: string;
}

export function MessageBubble({ message, searchQuery }: MessageBubbleProps) {
  const user = useAuthStore((state) => state.user);
  
  // Lightbox viewer states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [lightboxType, setLightboxType] = useState<"IMAGE" | "VIDEO" | "PDF">("IMAGE");
  const [lightboxName, setLightboxName] = useState("");

  const isSelf = message.senderId === user?.id;
  const isMediaOnly = message.attachments && message.attachments.length > 0 &&
    message.attachments.some((att: any) => att.fileType === "IMAGE" || att.fileType === "VIDEO") &&
    (message.content === message.attachments[0]?.fileName || !message.content);

  const handleDownload = (url: string, filename: string) => {
    const downloadUrl = `${API_BASE_URL}/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
    window.location.href = downloadUrl;
  };

  const chat = useChatStore((state) => state.chats.find(c => c.id === message.chatId));
  const otherMembersCount = chat ? Math.max(1, chat.members.length - 1) : 1;
  const receipts = message.receipts || [];
  
  const deliveredCount = receipts.filter((r: any) => r.deliveredAt || r.readAt).length;
  const readCount = receipts.filter((r: any) => r.readAt).length;
  
  const isRead = readCount >= otherMembersCount;
  const isDelivered = deliveredCount >= otherMembersCount;

  return (
    <div
      className={cn(
        "flex gap-3 w-full max-w-2xl px-4 py-1.5 transition-all relative group justify-start",
        isSelf ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
      )}
    >

      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isSelf ? "items-end" : "items-start")}>
        {!isSelf && (
          <span className="text-base font-bold text-zinc-700 dark:text-zinc-500 pl-2 mb-1">
            {message.sender.name}
          </span>
        )}

        <div
          className={cn(
            isMediaOnly
              ? "p-1 rounded-lg relative border overflow-hidden"
              : "px-4 py-2.5 rounded-lg relative border text-base sm:text-base leading-normal font-sans font-normal tracking-wide break-words whitespace-pre-wrap shadow-sm",
            isSelf
              ? "bg-blue-500 text-white border-blue-600 rounded-tr-none"
              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 rounded-tl-none",
            message.isSending && "opacity-70",
            message.hasFailed && "border-red-500/30 bg-red-50 text-red-500 dark:bg-red-900/10"
          )}
        >
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2 select-none">
              {message.attachments.map((att: any) => {
                const isImg = att.mimeType?.startsWith("image/") || att.fileType === "IMAGE";
                const isVid = att.mimeType?.startsWith("video/") || att.fileType === "VIDEO";
                const isAud = att.mimeType?.startsWith("audio/") || att.fileType === "AUDIO";

                if (isImg) {
                  return (
                    <div
                      key={att.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("IMAGE");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      }}
                      className={cn(
                        "relative rounded-xl overflow-hidden max-w-sm group cursor-pointer",
                        isMediaOnly ? "" : "border border-zinc-200/50 dark:border-white/5"
                      )}
                    >
                      <img src={att.fileUrl} alt={att.fileName} className="max-h-64 object-contain transition-transform duration-300 hover:scale-[1.02]" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(att.fileUrl, att.fileName);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                        title="Download image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                }

                if (isVid) {
                  return (
                    <div
                      key={att.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("VIDEO");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      }}
                      className={cn(
                        "relative rounded-xl overflow-hidden max-w-sm group cursor-pointer",
                        isMediaOnly ? "" : "border border-zinc-200/50 dark:border-white/5"
                      )}
                    >
                      <video src={att.fileUrl} className="max-h-64 object-contain pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/35 transition-colors">
                        <span className="p-2.5 rounded-full bg-zinc-600 text-white shadow-lg flex items-center justify-center">
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(att.fileUrl, att.fileName);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10"
                        title="Download video"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  );
                }

                if (isAud) {
                  return (
                    <div key={att.id} className="flex flex-col gap-1.5 p-1 max-w-xs">
                      <CustomAudioPlayer src={att.fileUrl} isSelf={isSelf} />
                    </div>
                  );
                }

                const isPdf = att.mimeType === "application/pdf" || att.fileName.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={att.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPdf) {
                        setLightboxUrl(att.fileUrl);
                        setLightboxType("PDF");
                        setLightboxName(att.fileName);
                        setLightboxOpen(true);
                      } else {
                        handleDownload(att.fileUrl, att.fileName);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer max-w-xs select-none",
                      isSelf
                        ? "bg-black/10 hover:bg-black/15 border-white/10"
                        : "bg-black/5 dark:bg-black/15 border-zinc-250/20 dark:border-white/5 hover:bg-black/10 dark:hover:bg-black/25"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0 transition-colors",
                        isSelf
                          ? "bg-white/20 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-500"
                      )}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-base font-bold truncate", isSelf ? "text-white" : "text-zinc-800 dark:text-zinc-200")}>
                        {att.fileName}
                      </p>
                      <p className={cn("text-base font-semibold", isSelf ? "text-blue-100/90" : "text-zinc-500 dark:text-zinc-450")}>
                        {(att.fileSize / 1024).toFixed(1)} KB {isPdf && "• PDF"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(att.fileUrl, att.fileName);
                      }}
                      className={cn(
                        "p-1.5 rounded-full transition-colors flex-shrink-0",
                        isSelf
                          ? "hover:bg-white/10 text-white/80 hover:text-white"
                          : "hover:bg-zinc-250/50 dark:hover:bg-zinc-750/50 text-[#54656f] dark:text-[#aebac1] hover:text-zinc-950 dark:hover:text-white"
                      )}
                      title="Download file"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {(!message.attachments || message.attachments.length === 0 || message.content !== message.attachments[0]?.fileName) &&
          message.type !== "AUDIO" && (
            <div className="flex flex-col gap-2">
              <p className="select-text">
                {(() => {
                  const text = message.content || "";
                  if (!searchQuery || !text) return text;
                  const parts = text.split(
                    new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi")
                  );
                  return (
                    <span>
                      {parts.map((part: string, index: number) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <mark
                            key={index}
                            className="bg-zinc-300 text-black px-0.5 rounded font-semibold animate-pulse-slow select-text"
                          >
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  );
                })()}
              </p>
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 text-base font-medium select-none",
              isMediaOnly
                ? "absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/5 z-20"
                : isSelf
                ? "text-white/70"
                : "text-zinc-550 dark:text-zinc-400"
            )}
          >
            <span className="text-[11px]">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isSelf && (
              <span className={cn("ml-1 flex items-center", isRead ? "text-blue-400" : (isMediaOnly ? "text-white/90" : "text-white/70"))}>
                {message.isSending ? (
                  <Clock size={12} />
                ) : message.hasFailed ? (
                  <AlertCircle size={12} className="text-red-400" />
                ) : isRead ? (
                  <CheckCheck size={14} />
                ) : isDelivered ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isSelf ? (
        <Avatar src={message.sender.avatarUrl} name={message.sender.name} size="sm" className="mt-0.5 flex-shrink-0" />
      ) : (
        <div className="w-1 flex-shrink-0" />
      )}

      {lightboxOpen && (
        <MediaLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          mediaUrl={lightboxUrl}
          mediaType={lightboxType}
          fileName={lightboxName}
        />
      )}
    </div>
  );
}
