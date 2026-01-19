import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchBooks, createBook, Book } from "../services/bookService";
import { toast } from "sonner";

interface Props {
  onBookSelect: (book: Book) => void;
}

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

    try {
      await createBook(title, "");
      setBooks(await fetchBooks());
      toast.success("Đã tạo sách mới");
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải sách...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>Danh sách sách</h2>
        <button
  onClick={handleCreateBook}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    background: "#2563eb", // blue-600
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "#1d4ed8"; // blue-700
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#2563eb";
  }}
  onMouseDown={(e) => {
    e.currentTarget.style.transform = "scale(0.97)";
  }}
  onMouseUp={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  <Plus size={16} />
  <span>Tạo sách</span>
</button>
      </div>

      {/* GRID – KHÔNG DÙNG TAILWIND */}
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: "repeat(5, 160px)",
          gap: 12,
        }}
      >
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onBookSelect(book)}
            style={{
              width: 160,
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {/* Cover */}
            <div
              style={{
                width: "100%",
                height: 220,
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {book.coverUrl ? "COVER" : "NO COVER"}
            </div>

            {/* Title */}
            <div
              style={{
                padding: 6,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {book.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
