import { useState } from "react";
import { BookList } from "./components/BookList";
import { BookDetail } from "./components/BookDetail";
import { Resources } from "./components/Resources";
import { BookOpen, FolderOpen, Settings } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

import type { Book } from "./services/bookService";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "resources" | "books" | "settings"
  >("resources");

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToList = () => {
    setSelectedBook(null);
  };

  const handleDeleteBook = (bookId: string) => {
    toast.success("Đã xóa sách");
    setSelectedBook(null);
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        {!selectedBook && (
          <aside className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-blue-600">
                Cờ Vua Cho Bé
              </h1>
              <p className="text-sm text-gray-500">Học chơi cờ vui vẻ</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveTab("resources")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "resources"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                Tài Nguyên
              </button>

              <button
                onClick={() => setActiveTab("books")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "books"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Danh Sách Sách
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === "settings"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <Settings className="w-5 h-5" />
                Cài Đặt
              </button>
            </nav>
          </aside>
        )}

        {/* Main */}
        <main className="flex-1 overflow-auto">
          {selectedBook ? (
            <BookDetail
              book={selectedBook}
              onBack={handleBackToList}
              onDelete={handleDeleteBook}
            />
          ) : (
            <>
              {activeTab === "resources" && <Resources />}
              {activeTab === "books" && (
                <BookList onBookSelect={handleBookSelect} />
              )}
              {activeTab === "settings" && (
                <div className="p-8">
                  <h2 className="text-3xl font-bold mb-4">Cài đặt</h2>
                  <p className="text-gray-600">
                    Các tùy chọn sẽ được bổ sung sau
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
