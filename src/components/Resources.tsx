import { useEffect, useState, useRef } from "react";
import {
  Folder,
  Image as ImageIcon,
  Trash2,
  ArrowLeft,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Background,
  fetchBackgrounds,
  addBackground,
  deleteBackground,
} from "../services/backgroundService";
import { uploadImageWithProgress } from "../lib/cloudinary";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function Resources() {
  const [view, setView] = useState<"folder" | "backgrounds">("folder");
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // State cho Upload
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (view === "backgrounds") {
      setLoadingList(true);
      fetchBackgrounds().then((data) => {
        setBackgrounds([...data].reverse());
        setLoadingList(false);
      });
    }
  }, [view]);

  /* ================= HANDLE UPLOAD ================= */
  const handleUploadBackground = async (file: File) => {
    if (file.size === 0) {
      toast.error("File lỗi");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ được upload file ảnh");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadImageWithProgress(file, setProgress);
      await addBackground(file.name, url);
      const data = await fetchBackgrounds();
      setBackgrounds([...data].reverse());
      toast.success("Đã thêm ảnh thành công");
    } catch (error) {
      console.error(error);
      toast.error("Upload thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  /* ================= HANDLE DELETE ================= */
  const handleDelete = async (id: string) => {
    const oldList = [...backgrounds];
    setBackgrounds((prev) => prev.filter((b) => b.id !== id));
    toast.success("Đã xóa ảnh");

    try {
      await deleteBackground(id);
    } catch (e) {
      setBackgrounds(oldList);
      toast.error("Lỗi xóa ảnh, đã khôi phục lại");
    }
  };

  /* ================= UI RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {view === "backgrounds" && (
              <button
                onClick={() => setView("folder")}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {view === "folder" ? "Tài Nguyên" : "Thư viện Ảnh"}
              </h1>
              <p className="text-sm text-gray-500">
                {view === "folder"
                  ? "Quản lý hệ thống"
                  : `${backgrounds.length} ảnh - Grid View`}
              </p>
            </div>
          </div>

          {/* --- ACTION BAR (Nút Upload NỔI BẬT) --- */}
          {view === "backgrounds" && (
            <div className="flex gap-2">
              <Button
                onClick={handleButtonClick}
                disabled={uploading}
                className="gap-2 border border-blue-600"
                size="sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Tải Ảnh Lên</span>
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                disabled={uploading}
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUploadBackground(e.target.files[0])
                }
              />
            </div>
          )}
        </div>

        {/* --- VIEW: FOLDER --- */}
        {view === "folder" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              onClick={() => setView("backgrounds")}
              className="group relative h-full bg-white rounded-3xl border border-gray-100 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden"
            >
              {/* 1. LAYER TRANG TRÍ NỀN */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors duration-500" />
              <Folder className="absolute -right-6 -bottom-6 w-36 h-36 text-gray-50 group-hover:text-blue-50 group-hover:rotate-12 transition-all duration-500" />

              {/* 2. NỘI DUNG CHÍNH */}
              <div className="relative z-10 flex flex-col items-start justify-between h-full min-h-[140px]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-8 h-8" />
                </div>

                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      Backgrounds
                    </h3>
                    <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-500">
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600">
                    Quản lý thư viện ảnh
                  </p>
                  <div className="mt-4 w-12 h-1 rounded-full bg-gray-200 group-hover:bg-blue-500 group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: LIST ẢNH --- */}
        {view === "backgrounds" && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 min-h-[400px]">
            {loadingList ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-100 rounded-xl h-56 w-full"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {backgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className="group relative rounded-xl bg-gray-50 border border-gray-100 h-56 flex items-center justify-center overflow-hidden hover:border-blue-200 transition-colors"
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="max-w-full max-h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bg.id);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 transform hover:scale-110 z-10"
                      title="Xóa ảnh vĩnh viễn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loadingList && backgrounds.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <ImageIcon className="w-16 h-16 text-gray-200 mb-4" />
                <p>Chưa có hình ảnh nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}