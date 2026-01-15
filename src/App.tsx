import { useState } from 'react';
import { BookList } from './components/BookList';
import { BookDetail } from './components/BookDetail';
import { Resources } from './components/Resources';
import { BookOpen, FolderOpen, Settings } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

interface Book {
  id: string;
  title: string;
  imageUrl: string;
  createdDate: string;
  lessonsCount: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('resources');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([
    {
      id: '1',
      title: 'Cờ Vua Cơ Bản - Cấp Độ 1',
      imageUrl: 'https://images.unsplash.com/photo-1745556380309-509a49b887bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwcGxheWluZyUyMGNoZXNzfGVufDF8fHx8MTc2ODAxMDQ0OXww&ixlib=rb-4.1.0&q=80&w=1080',
      createdDate: '15/12/2025',
      lessonsCount: 8,
    },
    {
      id: '2',
      title: 'Học Quân Cờ Vui Vẻ',
      imageUrl: 'https://images.unsplash.com/photo-1654741755763-b4cee51feb9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVzcyUyMGJvYXJkJTIwZ2FtZXxlbnwxfHx8fDE3Njc5MTUxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      createdDate: '20/12/2025',
      lessonsCount: 12,
    },
    {
      id: '3',
      title: 'Chiến Thuật Cờ Cho Trẻ',
      imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGxlYXJuaW5nfGVufDF8fHx8MTc2Nzk5NjY3MHww&ixlib=rb-4.1.0&q=80&w=1080',
      createdDate: '05/01/2026',
      lessonsCount: 10,
    },
  ]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleBackToList = () => {
    setSelectedBook(null);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
    setSelectedBook(null);
    toast.success('Đã xóa sách thành công!');
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Hide when viewing book detail */}
        {!selectedBook && (
          <aside className="w-64 bg-white shadow-lg flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-blue-600">Cờ Vua Cho Bé</h1>
              <p className="text-sm text-gray-500 mt-1">Học chơi cờ vui vẻ</p>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'resources'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FolderOpen className="w-5 h-5" />
                    <span>Tài Nguyên</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('books')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'books'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Danh Sách Sách</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Cài Đặt</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  🎯 Mẹo: Tạo sách dạy cờ theo từng cấp độ để trẻ dễ học!
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {selectedBook ? (
            <BookDetail book={selectedBook} onBack={handleBackToList} onDelete={handleDeleteBook} />
          ) : (
            <>
              {activeTab === 'resources' && <Resources />}
              {activeTab === 'books' && <BookList books={books} setBooks={setBooks} onBookSelect={handleBookSelect} />}
              {activeTab === 'settings' && (
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Cài Đặt</h2>
                  <p className="text-gray-600">Các tùy chọn cài đặt sẽ được thêm vào sau.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}