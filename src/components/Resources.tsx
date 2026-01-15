import { Folder, Image, Palette, FileImage, Sparkles } from 'lucide-react';

interface ResourceFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  itemCount: number;
  color: string;
}

export function Resources() {
  const folders: ResourceFolder[] = [
    {
      id: 'backgrounds',
      name: 'Backgrounds',
      icon: <Image className="w-8 h-8" />,
      itemCount: 24,
      color: 'bg-blue-500',
    },
    {
      id: 'icons',
      name: 'Icons',
      icon: <Sparkles className="w-8 h-8" />,
      itemCount: 156,
      color: 'bg-purple-500',
    },
    {
      id: 'chess-pieces',
      name: 'Chess Pieces',
      icon: <FileImage className="w-8 h-8" />,
      itemCount: 48,
      color: 'bg-green-500',
    },
    {
      id: 'decorations',
      name: 'Decorations',
      icon: <Palette className="w-8 h-8" />,
      itemCount: 72,
      color: 'bg-orange-500',
    },
  ];

  const handleFolderClick = (folderId: string) => {
    alert(`Mở folder: ${folderId}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Tài Nguyên</h2>
        <p className="text-gray-500 mt-1">Quản lý hình ảnh và tài liệu cho sách dạy cờ</p>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => handleFolderClick(folder.id)}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group p-6 border-2 border-transparent hover:border-blue-300"
          >
            {/* Folder Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`${folder.color} p-4 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                {folder.icon}
              </div>
              <Folder className="w-16 h-16 text-yellow-500 opacity-20 absolute -right-2 -top-2 group-hover:opacity-40 transition-opacity" />
            </div>

            {/* Folder Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                {folder.name}
              </h3>
              <p className="text-sm text-gray-500">
                {folder.itemCount} items
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Folder className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có thư mục nào</h3>
          <p className="text-gray-500">Các thư mục tài nguyên sẽ xuất hiện ở đây</p>
        </div>
      )}
    </div>
  );
}
