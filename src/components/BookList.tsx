import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { fetchBooks, createBook, Book } from "../services/bookService";
import { toast } from "sonner";

interface Props {
  onBookSelect: (book: Book) => void;
}

/* ================= HELPERS ================= */

function getGradientFromTitle(title: string) {
  const colors = [
    ["from-blue-500", "to-blue-700"],
    ["from-purple-500", "to-purple-700"],
    ["from-green-500", "to-green-700"],
    ["from-pink-500", "to-pink-700"],
    ["from-orange-500", "to-orange-700"],
    ["from-teal-500", "to-teal-700"],
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function isValidCover(url?: string) {
  return typeof url === "string" && url.startsWith("http");
}

/* ================= COMPONENT ================= */

export function BookList({ onBookSelect }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBook = async () => {
    const title = prompt("Nhập tên sách");
    if (!title) return;

    await createBook(title, ""); // chưa có cover
    setBooks(await fetchBooks());

    toast.success("Đã tạo sách mới");
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Đang tải sách…</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Danh sách sách</h2>
        <button
          onClick={handleCreateBook}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Tạo sách
        </button>
      </div>

      {/* LIST – BOOK RECTANGLE */}
      <div className="flex flex-wrap gap-8">
        {books.map((book) => {
          const hasCover = isValidCover(book.coverUrl);
          const [from, to] = getGradientFromTitle(book.title);

          return (
            <div
              key={book.id}
              onClick={() => onBookSelect(book)}
              className="
                group cursor-pointer
                w-[280px]
                bg-white
                rounded-xl
                shadow-lg
                hover:shadow-2xl
                transition
                overflow-hidden
              "
            >
              {/* COVER */}
              <div className="h-[420px] bg-gray-100">
                {hasCover ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${from} ${to}
                flex items-center justify-center text-white`}
                  >
                    <BookOpen className="w-16 h-16 opacity-90" />
                  </div>
                )}
              </div>

              {/* TITLE */}
              <div className="p-4">
                <p className="text-lg font-semibold text-gray-800 line-clamp-2 text-center">
                  {book.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty */}
      {books.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          Chưa có sách nào
        </div>
      )}
    </div>
  );
}
