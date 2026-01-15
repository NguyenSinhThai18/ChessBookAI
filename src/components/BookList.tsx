import { useState } from 'react';
import { Plus, BookOpen, Calendar } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  imageUrl: string;
  createdDate: string;
  lessonsCount: number;
}

interface BookListProps {
  books: Book[];
  setBooks: (books: Book[]) => void;
  onBookSelect: (book: Book) => void;
}

export function BookList({ books, setBooks, onBookSelect }: BookListProps) {
  const handleCreateBook = () => {
    // Logic tạo sách mới sẽ được thêm sau
    alert('Chức năng tạo sách mới sẽ được thêm vào!');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Danh Sách Sách</h2>
          <p className="text-gray-500 mt-1">Quản lý các sách dạy chơi cờ cho trẻ em</p>
        </div>
        <button
          onClick={handleCreateBook}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Sách Mới</span>
        </button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onBookSelect(book)}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer group"
            style={{ aspectRatio: '1 / 1.414' }}
          >
            {/* Book Image - Tờ A4 style */}
            <div className="relative h-full overflow-hidden bg-gray-200">
              <img
                src={book.imageUrl}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay gradient for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Book Title at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-base font-semibold text-white line-clamp-2">
                  {book.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (hiển thị khi không có sách) */}
      {books.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có sách nào</h3>
          <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo sách dạy cờ đầu tiên!</p>
          <button
            onClick={handleCreateBook}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo Sách Đầu Tiên</span>
          </button>
        </div>
      )}
    </div>
  );
}