// src/ui/BookDetail.tsx

import { useState, useEffect, useRef } from "react";
import { callGitHubAI } from "../ai/githubAiClient";
import { mapAiJsonToPages } from "../ai/mapAiJsonToPages";
import { normalizePageElements } from "../ai/normalizePageElements";
import { buildChessBookPrompt } from "../ai/aiPrompt";
import { fetchPages, saveAllPages } from "../services/pageService";
import { updateBook } from "../services/bookService";
import type { Book } from "../services/bookService";
import { deleteBook } from "../services/bookService";
import { uploadImageToCloudinary } from "../services/uploadService";
import { fetchIcons, addIcon, type Icon } from "../services/iconService";
import { Save } from "lucide-react";

import {
  ArrowLeft,
  FileText,
  Maximize2,
  Monitor,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  ChevronRight,
  Image,
  Sparkles,
  Palette,
  Grid3x3,
  Trash2,
  Eye,
  EyeOff,
  Move,
  ChevronUp,
  ChevronDown,
  Copy,
  ClipboardPaste,
  Wand2,
  X,
  Circle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
} from "lucide-react";
import { Resizable } from "re-resizable";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

// Import types from ai module
import type { PageElement } from "../ai/mapAiJsonToPages";

// Type guard to check if item has a url property
function isIconItem(item: any): item is { id: number; name: string; url: string } {
  return 'url' in item && typeof item.url === 'string';
}

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onDelete: (bookId: string) => void;
}

type PageSize = "a4" | "a5";
type PageOrientation = "portrait" | "landscape";

interface Page {
  id: string;
  content: string;
  elements: PageElement[];
}

export function BookDetail({ book, onBack, onDelete }: BookDetailProps) {
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<PageOrientation>("portrait");
  const [pages, setPages] = useState<Page[]>([
    { id: "1", content: "Trang 1", elements: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [chessColor1, setChessColor1] = useState("#f0d9b5");
  const [chessColor2, setChessColor2] = useState("#b58863");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [pendingChessPiece, setPendingChessPiece] = useState<{
    piece: any;
    side: "a" | "b";
  } | null>(null);
  const [pendingMarker, setPendingMarker] = useState<{
    marker: any;
  } | null>(null);
  const [copiedElements, setCopiedElements] = useState<PageElement[] | null>(
    null
  );
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTemplate, setAiTemplate] = useState<PageElement[]>([]);
  const [aiPageCount, setAiPageCount] = useState(5);
  const [aiPageCountMode, setAiPageCountMode] = useState<"fixed" | "auto">(
    "fixed"
  ); // 'fixed' or 'auto'
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedAIElementId, setSelectedAIElementId] = useState<string | null>(
    null
  );
  const [templateChessStyle, setTemplateChessStyle] = useState<
    "classic" | "green" | "gray" | "brown"
  >("classic");

  // Icons management
  const [icons, setIcons] = useState<Icon[]>([]);

  // Refs for element auto-scroll
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Chess pieces data - with proper chess symbols
  const chessPieces = [
    { id: "king", name: "Vua", whiteSymbol: "♔", blackSymbol: "♚" },
    { id: "queen", name: "Hậu", whiteSymbol: "♕", blackSymbol: "♛" },
    { id: "knight", name: "Mã", whiteSymbol: "♘", blackSymbol: "♞" },
    { id: "bishop", name: "Tượng", whiteSymbol: "♗", blackSymbol: "♝" },
    { id: "rook", name: "Xe", whiteSymbol: "♖", blackSymbol: "♜" },
    { id: "pawn", name: "Tốt", whiteSymbol: "♙", blackSymbol: "♟" },
  ];

  // Chess markers data - dots and arrows
  const chessMarkers = [
    { id: "dot", name: "Dấu chấm", icon: Circle, color: "green" },
    { id: "arrow-up", name: "Mũi tên lên", icon: ArrowUp, color: "blue" },
    { id: "arrow-down", name: "Mũi tên xuống", icon: ArrowDown, color: "blue" },
    {
      id: "arrow-right",
      name: "Mũi tên phải",
      icon: ArrowRight,
      color: "blue",
    },
    {
      id: "arrow-left",
      name: "Mũi tên trái",
      icon: ArrowLeftIcon,
      color: "blue",
    },
  ];

  // Mock resource data
  const resourceFolders = [
    {
      id: "backgrounds",
      name: "Backgrounds",
      icon: <Image className="w-5 h-5" />,
      color: "bg-blue-500",
      items: [
        {
          id: 1,
          name: "Background 1",
          url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
        },
        {
          id: 2,
          name: "Background 2",
          url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400",
        },
        {
          id: 3,
          name: "Background 3",
          url: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=400",
        },
        {
          id: 4,
          name: "Background 4",
          url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400",
        },
      ],
    },
    {
      id: "icons",
      name: "Icons",
      icon: <Sparkles className="w-5 h-5" />,
      color: "bg-purple-500",
      items: [
        {
          id: 1,
          name: "Icon 1",
          url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400",
        },
        {
          id: 2,
          name: "Icon 2",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
        },
        {
          id: 3,
          name: "Icon 3",
          url: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400",
        },
      ],
    },
    {
      id: "chessboard",
      name: "Bàn Cờ",
      icon: <Grid3x3 className="w-5 h-5" />,
      color: "bg-amber-600",
      items: [],
    },
    {
      id: "text",
      name: "Văn bản",
      icon: <FileText className="w-5 h-5" />,
      color: "bg-emerald-500",
      items: [
        { id: "title", name: "Tiêu đề" },
        { id: "body", name: "Nội dung" },
      ],
    },
  ];

  const handleAddPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      content: `Trang ${pages.length + 1}`,
      elements: [],
    };
    setPages([...pages, newPage]);
  };

  /* ================= LOAD PAGES WHEN OPENING BOOKDETAIL ================= */
  useEffect(() => {
    fetchPages(book.id).then((data) => {
      if (data.length > 0) {
        setPages(
          data
            .sort((a: any, b: any) => a.order - b.order)
            .map((p: any) => ({
              id: p.id,
              content: p.content,
              elements: p.elements || [],
            }))
        );
      }
    });
  }, [book.id]);

  /* ================= LOAD ICONS ================= */
  useEffect(() => {
    fetchIcons().then(setIcons).catch(console.error);
  }, []);

  /* ================= AUTO SCROLL TO SELECTED ELEMENT ================= */
  useEffect(() => {
    if (selectedElementId && elementRefs.current[selectedElementId]) {
      elementRefs.current[selectedElementId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedElementId]);

  /* ================= HANDLE SAVE BOOK ================= */
  const handleSaveBook = async () => {
    try {
      setSaving(true);

      // 1. update book meta
      await updateBook(book.id, {
        pageSize,
        orientation,
      });

      // 2. save pages
      await saveAllPages(book.id, pages);

      toast.success("Đã lưu sách thành công");
    } catch (err) {
      console.error(err);
      toast.error("Lưu sách thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa sách "${book.title}"?\nHành động này KHÔNG thể hoàn tác.`
    );

    if (!ok) return;

    try {
      await deleteBook(book.id);
      toast.success("Đã xóa sách");
      onDelete(book.id); // quay về BookList
    } catch (err) {
      console.error(err);
      toast.error("Xóa sách thất bại");
    }
  };

  // Delete page
  const handleDeletePage = (pageId: string) => {
    if (pages.length === 1) {
      toast.error("Không thể xóa trang duy nhất!");
      return;
    }

    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa Trang ${pageId}? Hành động này không thể hoàn tác.`
      )
    ) {
      // Remove the page
      const updatedPages = pages.filter((p) => p.id !== pageId);
      setPages(updatedPages);

      // Deselect if the deleted page was selected
      if (selectedPageId === pageId) {
        setSelectedPageId(null);
        setSelectedElementId(null);
      }

      toast.success(`Đã xóa Trang ${pageId}`);
    }
  };

  // Add background to selected page
  const handleAddBackground = (item: any) => {
    if (!selectedPageId) {
      alert("Vui lòng chọn trang trước khi thêm background");
      return;
    }

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const newElement: PageElement = {
      id: `bg-${Date.now()}`,
      type: "background",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 }, // percentage
      layer: 0,
      data: { url: item.url, name: item.name },
      visible: true,
    };

    const updatedPages = [...pages];
    updatedPages[pageIndex].elements.push(newElement);
    setPages(updatedPages);
  };

  // Add chessboard to selected page
  const handleAddChessboard = () => {
    if (!selectedPageId) {
      alert("Vui lòng chọn trang trước khi thêm bàn cờ");
      return;
    }

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const maxLayer = Math.max(
      0,
      ...pages[pageIndex].elements.map((e) => e.layer)
    );

    const newElement: PageElement = {
      id: `chess-${Date.now()}`,
      type: "chessboard",
      position: { x: 100, y: 100 },
      size: { width: 300, height: 300 },
      layer: maxLayer + 1,
      data: { color1: chessColor1, color2: chessColor2 },
      visible: true,
    };

    const updatedPages = [...pages];
    updatedPages[pageIndex].elements.push(newElement);
    setPages(updatedPages);
  };

  // Handle chess piece click
  const handleChessPieceClick = (piece: any, side: "a" | "b") => {
    if (!selectedPageId) {
      return;
    }

    setPendingChessPiece({ piece, side });
    setPendingMarker(null); // Clear pending marker
  };

  // Handle marker click
  const handleMarkerClick = (marker: any) => {
    if (!selectedPageId) {
      return;
    }

    setPendingMarker({ marker });
    setPendingChessPiece(null); // Clear pending chess piece
  };

  // Handle chessboard cell click
  const handleChessCellClick = (
    chessboardId: string,
    row: number,
    col: number
  ) => {
    if ((!pendingChessPiece && !pendingMarker) || !selectedPageId) return;

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    // Find chessboard element
    const chessboard = pages[pageIndex].elements.find(
      (e) => e.id === chessboardId
    );
    if (!chessboard) return;

    const cellSize = chessboard.size.width / 8;
    const maxLayer = Math.max(
      0,
      ...pages[pageIndex].elements.map((e) => e.layer)
    );

    let newElement: PageElement;

    const markerSize = 40;

    if (pendingChessPiece) {
      // Add chess piece
      newElement = {
        id: `piece-${Date.now()}`,
        type: "chess-piece",
        position: {
          x:
            chessboard.position.x +
            col * cellSize +
            cellSize / 2 -
            markerSize / 2,
          y:
            chessboard.position.y +
            row * cellSize +
            cellSize / 2 -
            markerSize / 2,
        },
        size: { width: markerSize, height: markerSize },
        layer: maxLayer + 1,
        data: {
          pieceId: pendingChessPiece.piece.id,
          side: pendingChessPiece.side,
          chessboardId,
          row,
          col,
        },
        visible: true,
      };
      setPendingChessPiece(null);
    } else if (pendingMarker) {
      // Add marker
      newElement = {
        id: `marker-${Date.now()}`,
        type: "chess-marker",
        position: {
          x:
            chessboard.position.x +
            col * cellSize +
            cellSize / 2 -
            markerSize / 2,
          y:
            chessboard.position.y +
            row * cellSize +
            cellSize / 2 -
            markerSize / 2,
        },
        size: { width: markerSize, height: markerSize },
        layer: maxLayer + 1,
        data: {
          markerId: pendingMarker.marker.id,
          chessboardId,
          row,
          col,
        },
        visible: true,
      };
      setPendingMarker(null);
    } else {
      return;
    }

    const updatedPages = [...pages];
    updatedPages[pageIndex].elements.push(newElement);
    setPages(updatedPages);
  };

  // Update element position
  const handleUpdateElementPosition = (
    pageId: string,
    elementId: string,
    x: number,
    y: number
  ) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex !== -1) {
      updatedPages[pageIndex].elements[elementIndex].position = { x, y };

      // If it's a chess piece or marker, also update the board coordinates
      const element = updatedPages[pageIndex].elements[elementIndex];
      if (
        (element.type === "chess-piece" || element.type === "chess-marker") &&
        element.data.chessboardId
      ) {
        const chessboard = updatedPages[pageIndex].elements.find(
          (e) => e.id === element.data.chessboardId
        );
        if (chessboard) {
          const cellSize = chessboard.size.width / 8;

          // Calculate the center position of the piece
          const pieceCenterX = x + element.size.width / 2;
          const pieceCenterY = y + element.size.height / 2;

          // Calculate relative position to chessboard
          const relativeX = pieceCenterX - chessboard.position.x;
          const relativeY = pieceCenterY - chessboard.position.y;

          // Calculate which cell the piece is in
          const col = Math.floor(relativeX / cellSize);
          const row = Math.floor(relativeY / cellSize);

          // Only update if within valid board range
          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            // Snap to center of cell
            updatedPages[pageIndex].elements[elementIndex].position = {
              x:
                chessboard.position.x +
                col * cellSize +
                cellSize / 2 -
                element.size.width / 2,
              y:
                chessboard.position.y +
                row * cellSize +
                cellSize / 2 -
                element.size.height / 2,
            };

            updatedPages[pageIndex].elements[elementIndex].data = {
              ...element.data,
              row,
              col,
            };
          }
        }
      }

      setPages(updatedPages);
    }
  };

  // Update element size
  const handleUpdateElementSize = (
    pageId: string,
    elementId: string,
    width: number,
    height: number
  ) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex !== -1) {
      updatedPages[pageIndex].elements[elementIndex].size = { width, height };
      setPages(updatedPages);
    }
  };

  const handleUpdateBoardPosition = (
    pageId: string,
    elementId: string,
    col: number,
    row: number
  ) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex === -1) return;

    const element = updatedPages[pageIndex].elements[elementIndex];

    // Only process for chess pieces and markers
    if (element.type !== "chess-piece" && element.type !== "chess-marker") {
      return;
    }

    const chessboard = updatedPages[pageIndex].elements.find(
      (e) => e.id === element.data.chessboardId
    );
    if (!chessboard) return;

    const cellSize = chessboard.size.width / 8;

    updatedPages[pageIndex].elements[elementIndex].position = {
      x:
        chessboard.position.x +
        col * cellSize +
        cellSize / 2 -
        element.size.width / 2,
      y:
        chessboard.position.y +
        row * cellSize +
        cellSize / 2 -
        element.size.height / 2,
    };

    updatedPages[pageIndex].elements[elementIndex].data = {
      ...element.data,
      row,
      col,
    };

    setPages(updatedPages);
  };

  // Update chess piece board position
  const handleUpdateChessPiecePosition = (
    pageId: string,
    elementId: string,
    col: number,
    row: number
  ) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex === -1) return;

    const element = updatedPages[pageIndex].elements[elementIndex];

    // Only process for chess pieces and markers
    if (element.type !== "chess-piece" && element.type !== "chess-marker") {
      return;
    }

    // Find the chessboard
    const chessboard = updatedPages[pageIndex].elements.find(
      (e) => e.id === element.data.chessboardId
    );
    if (!chessboard) {
      console.error("Chessboard not found for piece:", elementId);
      return;
    }

    const cellSize = chessboard.size.width / 8;
    const pieceWidth = element.size.width;
    const pieceHeight = element.size.height;

    // Update position and data - center the piece in the cell
    updatedPages[pageIndex].elements[elementIndex].position = {
      x: chessboard.position.x + col * cellSize + cellSize / 2 - pieceWidth / 2,
      y:
        chessboard.position.y + row * cellSize + cellSize / 2 - pieceHeight / 2,
    };
    updatedPages[pageIndex].elements[elementIndex].data = {
      ...element.data,
      row,
      col,
    };
    setPages(updatedPages);
  };

  // Delete element
  const handleDeleteElement = (pageId: string, elementId: string) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    updatedPages[pageIndex].elements = updatedPages[pageIndex].elements.filter(
      (e) => e.id !== elementId
    );
    setPages(updatedPages);
    setSelectedElementId(null);
  };

  // Toggle element visibility
  const handleToggleVisibility = (pageId: string, elementId: string) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex !== -1) {
      updatedPages[pageIndex].elements[elementIndex].visible =
        !updatedPages[pageIndex].elements[elementIndex].visible;
      setPages(updatedPages);
    }
  };

  // Move element layer
  const handleMoveLayer = (
    pageId: string,
    elementId: string,
    direction: "up" | "down"
  ) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];
    const elementIndex = updatedPages[pageIndex].elements.findIndex(
      (e) => e.id === elementId
    );
    if (elementIndex !== -1) {
      const newLayer =
        direction === "up"
          ? updatedPages[pageIndex].elements[elementIndex].layer + 1
          : Math.max(
              0,
              updatedPages[pageIndex].elements[elementIndex].layer - 1
            );
      updatedPages[pageIndex].elements[elementIndex].layer = newLayer;
      setPages(updatedPages);
    }
  };

  // Copy page elements
  const handleCopyPageElements = () => {
    if (!selectedPageId) {
      toast.error("Vui lòng chọn trang để copy thông số");
      return;
    }

    const page = pages.find((p) => p.id === selectedPageId);
    if (!page || page.elements.length === 0) {
      toast.error("Trang này không có thành phần nào để copy");
      return;
    }

    // Deep copy elements
    const elementsCopy = JSON.parse(JSON.stringify(page.elements));
    setCopiedElements(elementsCopy);
    toast.success(
      `Đã copy ${elementsCopy.length} thành phần từ Trang ${selectedPageId}`
    );
  };

  // Paste page elements
  const handlePastePageElements = () => {
    if (!selectedPageId) {
      toast.error("Vui lòng chọn trang để paste thông số");
      return;
    }

    if (!copiedElements || copiedElements.length === 0) {
      toast.error("Chưa có thông số nào được copy");
      return;
    }

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const updatedPages = [...pages];

    // Create a mapping from old IDs to new IDs for chessboards
    const idMapping: { [oldId: string]: string } = {};

    // First pass: Create new elements and build ID mapping
    const newElements = copiedElements.map((element) => {
      const newId = `${element.type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // If it's a chessboard, store the ID mapping
      if (element.type === "chessboard") {
        idMapping[element.id] = newId;
      }

      return {
        ...element,
        id: newId,
      };
    });

    // Second pass: Update chessboardId references and restore icon components in chess pieces and markers
    newElements.forEach((element) => {
      if (element.type === "chess-piece") {
        // Update chessboardId reference
        if (element.data?.chessboardId) {
          const oldChessboardId = element.data.chessboardId;
          // If we have a new ID for this chessboard, update the reference
          if (idMapping[oldChessboardId]) {
            element.data.chessboardId = idMapping[oldChessboardId];
          }
        }

        // No need to restore - pieceId is already stored correctly
        // Pieces will be looked up by ID during render
      }

      if (element.type === "chess-marker") {
        // Update chessboardId reference
        if (element.data?.chessboardId) {
          const oldChessboardId = element.data.chessboardId;
          if (idMapping[oldChessboardId]) {
            element.data.chessboardId = idMapping[oldChessboardId];
          }
        }

        // No need to restore - markerId is already stored correctly
        // Markers will be looked up by ID during render
      }
    });

    // Add all new elements to the page
    updatedPages[pageIndex].elements = [
      ...updatedPages[pageIndex].elements,
      ...newElements,
    ];
    setPages(updatedPages);
    toast.success(
      `Đã paste ${newElements.length} thành phần vào Trang ${selectedPageId}`
    );
  };

  // Add image to page
  const handleAddImage = (icon: Icon) => {
    if (!selectedPageId) {
      toast.error("Vui lòng chọn trang");
      return;
    }

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const newElement: PageElement = {
      id: `img-${Date.now()}`,
      type: "image",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 200 },
      layer: 10,
      data: {
        url: icon.url,
        name: icon.name,
      },
      visible: true,
    };

    const updated = [...pages];
    updated[pageIndex].elements.push(newElement);
    setPages(updated);
    setSelectedElementId(newElement.id);
    toast.success("Đã thêm ảnh");
  };

  // Add text to page
  const handleAddText = (type: "title" | "body") => {
    if (!selectedPageId) {
      toast.error("Vui lòng chọn trang");
      return;
    }

    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const newText: PageElement = {
      id: `text-${Date.now()}`,
      type: "text",
      position: { x: 100, y: 100 },
      size: { width: 300, height: 80 },
      layer: 20,
      data: {
        text: type === "title" ? "Tiêu đề" : "Nội dung",
        textType: type,
        fontSize: type === "title" ? 28 : 16,
        fontWeight: type === "title" ? 700 : 400,
      },
      visible: true,
    };

    const updated = [...pages];
    updated[pageIndex].elements.push(newText);
    setPages(updated);
    setSelectedElementId(newText.id);
    toast.success("Đã thêm văn bản");
  };

  // Chess style presets
  const chessStylePresets = {
    classic: { color1: "#f0d9b5", color2: "#b58863", name: "Cổ điển" },
    green: { color1: "#eeeed2", color2: "#769656", name: "Xanh lá" },
    gray: { color1: "#e8e8e8", color2: "#4a4a4a", name: "Xám" },
    brown: { color1: "#ffd1a0", color2: "#8b4513", name: "Nâu" },
  };

  // AI Template handlers
  const handleAddChessboardToTemplate = () => {
    const maxLayer = Math.max(0, ...aiTemplate.map((e) => e.layer));
    const selectedStyle = chessStylePresets[templateChessStyle];
    const newElement: PageElement = {
      id: `chess-${Date.now()}`,
      type: "chessboard",
      position: { x: 60, y: 180 },
      size: { width: 400, height: 400 },
      layer: maxLayer + 1,
      data: {
        color1: selectedStyle.color1,
        color2: selectedStyle.color2,
      },
      visible: true,
    };
    setAiTemplate([...aiTemplate, newElement]);
  };

  const handleDeleteTemplateElement = (elementId: string) => {
    setAiTemplate(aiTemplate.filter((e) => e.id !== elementId));
  };

  const handleUpdateTemplateElementPosition = (
    elementId: string,
    x: number,
    y: number
  ) => {
    setAiTemplate(
      aiTemplate.map((e) =>
        e.id === elementId ? { ...e, position: { x, y } } : e
      )
    );
  };

  const handleUpdateTemplateElementSize = (
    elementId: string,
    width: number,
    height: number
  ) => {
    setAiTemplate(
      aiTemplate.map((e) =>
        e.id === elementId ? { ...e, size: { width, height } } : e
      )
    );
  };

  function sanitizeAIJson(aiJson: any) {
    aiJson.pages?.forEach((p: any) => {
      if (p.type === "exercise") {
        delete p.points;
      }

      if (p.type === "guide") {
        if (!Array.isArray(p.points)) {
          p.points = [];
        }
      }
    });
    return aiJson;
  }

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Vui lòng nhập prompt");
      return;
    }

    try {
      toast.info("Đang gọi AI...");

      const finalPrompt = buildChessBookPrompt(aiPrompt);

      const aiText = await callGitHubAI(finalPrompt);

      if (!aiText) {
        throw new Error("AI trả về rỗng");
      }

      const aiJson = sanitizeAIJson(JSON.parse(aiText));

      const newPages = mapAiJsonToPages(aiJson, aiTemplate).map(
        (page, index) => ({
          ...page,
          // Force string ID for pages created by AI to avoid number vs string issues
          id: `ai-page-${Date.now()}-${index}`,
          elements: normalizePageElements(
            page.elements.map((el) => {
              // For chess-piece, ensure pieceId is stored correctly
              if (el.type === "chess-piece") {
                const pieceId = el.data?.pieceId;
                return {
                  ...el,
                  data: {
                    ...el.data,
                    pieceId: pieceId,
                  },
                };
              }

              // For chess-marker, ensure markerId is stored correctly
              if (el.type === "chess-marker") {
                const markerId = el.data?.markerId;
                return {
                  ...el,
                  data: {
                    ...el.data,
                    markerId: markerId,
                  },
                };
              }

              // Default: return element as-is
              return el;
            })
          ),
        })
      );

      setPages((prev) => [...prev, ...newPages]);

      setIsAIModalOpen(false);

      toast.success(`Đã tạo ${newPages.length} trang từ AI`);
    } catch (err: any) {
      console.error(err);
      toast.error("AI lỗi hoặc JSON không hợp lệ");
    }
  };

  // Calculate page dimensions based on size and orientation
  const getPageDimensions = () => {
    const baseWidth = pageSize === "a4" ? 210 : 148;
    const baseHeight = pageSize === "a4" ? 297 : 210;

    if (orientation === "landscape") {
      return {
        width: baseHeight * 2.5,
        height: baseWidth * 2.5,
      };
    }
    return {
      width: baseWidth * 2.5,
      height: baseHeight * 2.5,
    };
  };

  const pageDimensions = getPageDimensions();
  const selectedPageIndex = selectedPageId
    ? pages.findIndex((p) => p.id === selectedPageId)
    : -1;

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Elements Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">Thành Phần</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {selectedPageId
              ? `Trang ${selectedPageIndex >= 0 ? selectedPageIndex + 1 : "-"}`
              : "Chưa chọn trang"}
          </p>

          {/* Copy/Paste Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyPageElements}
              disabled={!selectedPageId}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              title="Copy thông số trang"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handlePastePageElements}
              disabled={!selectedPageId || !copiedElements}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              title="Paste thông số vào trang"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Paste</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {selectedPageId ? (
            (() => {
              const page = pages.find((p) => p.id === selectedPageId);
              if (!page || page.elements.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Chưa có thành phần nào</p>
                  </div>
                );
              }

              const sortedElements = [...page.elements].sort(
                (a, b) => b.layer - a.layer
              );

              return (
                <div className="space-y-2">
                  {sortedElements.map((element) => (
                    <div
                      key={element.id}
                      ref={(el) => {
                        elementRefs.current[element.id] = el;
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedElementId === element.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedElementId(element.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {element.type === "background" && "🖼️ Background"}
                          {element.type === "chessboard" && "♟️ Bàn cờ"}
                          {element.type === "chess-piece" &&
                            (() => {
                              const pieceDef = chessPieces.find(
                                (p) => p.id === element.data?.pieceId
                              );

                              if (!pieceDef) return "❓ Quân cờ không xác định";

                              return `${
                                element.data.side === "a" ? "⚪" : "⚫"
                              } ${pieceDef.name}`;
                            })()}

                          {element.type === "chess-marker" &&
                            (() => {
                              const markerDef = chessMarkers.find(
                                (m) => m.id === element.data?.markerId
                              );

                              if (!markerDef) return "❓ Marker";

                              return `📍 ${markerDef.name}`;
                            })()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(
                                selectedPageId,
                                element.id
                              );
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {element.visible ? (
                              <Eye className="w-4 h-4 text-gray-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElement(selectedPageId, element.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Properties */}
                      <div className="space-y-3">
                        {/* Position */}
                        {element.type !== "background" && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                              Vị trí (px)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label
                                  htmlFor={`${element.id}-x`}
                                  className="text-xs text-gray-500"
                                >
                                  X:
                                </Label>
                                <Input
                                  id={`${element.id}-x`}
                                  type="number"
                                  value={Math.round(element.position.x)}
                                  onChange={(e) => {
                                    const newX =
                                      parseFloat(e.target.value) || 0;
                                    handleUpdateElementPosition(
                                      selectedPageId,
                                      element.id,
                                      newX,
                                      element.position.y
                                    );
                                  }}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    e.target.select();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="h-8 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`${element.id}-y`}
                                  className="text-xs text-gray-500"
                                >
                                  Y:
                                </Label>
                                <Input
                                  id={`${element.id}-y`}
                                  type="number"
                                  value={Math.round(element.position.y)}
                                  onChange={(e) => {
                                    const newY =
                                      parseFloat(e.target.value) || 0;
                                    handleUpdateElementPosition(
                                      selectedPageId,
                                      element.id,
                                      element.position.x,
                                      newY
                                    );
                                  }}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    e.target.select();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="h-8 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Chess piece board position */}
                        {element.type === "chess-piece" &&
                          element.data.row !== undefined &&
                          element.data.col !== undefined && (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-600">
                                Tọa độ bàn cờ
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label
                                    htmlFor={`${element.id}-col`}
                                    className="text-xs text-gray-500"
                                  >
                                    Cột (A-H):
                                  </Label>
                                  <Input
                                    id={`${element.id}-col`}
                                    type="text"
                                    value={String.fromCharCode(
                                      65 + element.data.col
                                    )}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value.toUpperCase();
                                      if (value.length === 0) return;
                                      if (
                                        value.length === 1 &&
                                        value >= "A" &&
                                        value <= "H"
                                      ) {
                                        const newCol = value.charCodeAt(0) - 65;
                                        handleUpdateChessPiecePosition(
                                          selectedPageId,
                                          element.id,
                                          newCol,
                                          element.data.row
                                        );
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      e.target.select();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs text-center font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    maxLength={1}
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`${element.id}-row`}
                                    className="text-xs text-gray-500"
                                  >
                                    Hàng (1-8):
                                  </Label>
                                  <Input
                                    id={`${element.id}-row`}
                                    type="number"
                                    value={8 - element.data.row}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (
                                        !isNaN(value) &&
                                        value >= 1 &&
                                        value <= 8
                                      ) {
                                        const newRow = 8 - value;
                                        handleUpdateChessPiecePosition(
                                          selectedPageId,
                                          element.id,
                                          element.data.col,
                                          newRow
                                        );
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      e.target.select();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs text-center font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    min={1}
                                    max={8}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Chess marker board position */}
                        {element.type === "chess-marker" &&
                          element.data.row !== undefined &&
                          element.data.col !== undefined && (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-600">
                                Tọa độ bàn cờ
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label
                                    htmlFor={`${element.id}-col`}
                                    className="text-xs text-gray-500"
                                  >
                                    Cột (A-H):
                                  </Label>
                                  <Input
                                    id={`${element.id}-col`}
                                    type="text"
                                    value={String.fromCharCode(
                                      65 + element.data.col
                                    )}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value.toUpperCase();
                                      if (value.length === 0) return;
                                      if (
                                        value.length === 1 &&
                                        value >= "A" &&
                                        value <= "H"
                                      ) {
                                        const newCol = value.charCodeAt(0) - 65;
                                        handleUpdateChessPiecePosition(
                                          selectedPageId,
                                          element.id,
                                          newCol,
                                          element.data.row
                                        );
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      e.target.select();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs text-center font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    maxLength={1}
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`${element.id}-row`}
                                    className="text-xs text-gray-500"
                                  >
                                    Hàng (1-8):
                                  </Label>
                                  <Input
                                    id={`${element.id}-row`}
                                    type="number"
                                    value={8 - element.data.row}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (
                                        !isNaN(value) &&
                                        value >= 1 &&
                                        value <= 8
                                      ) {
                                        const newRow = 8 - value;
                                        handleUpdateChessPiecePosition(
                                          selectedPageId,
                                          element.id,
                                          element.data.col,
                                          newRow
                                        );
                                      }
                                    }}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      e.target.select();
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs text-center font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                    min={1}
                                    max={8}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Size */}
                        {element.type !== "background" && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                              Kích thước (px)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label
                                  htmlFor={`${element.id}-w`}
                                  className="text-xs text-gray-500"
                                >
                                  W:
                                </Label>
                                <Input
                                  id={`${element.id}-w`}
                                  type="number"
                                  value={Math.round(element.size.width)}
                                  onChange={(e) => {
                                    const newW =
                                      parseFloat(e.target.value) || 0;
                                    handleUpdateElementSize(
                                      selectedPageId,
                                      element.id,
                                      newW,
                                      element.size.height
                                    );
                                  }}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    e.target.select();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="h-8 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div>
                                <Label
                                  htmlFor={`${element.id}-h`}
                                  className="text-xs text-gray-500"
                                >
                                  H:
                                </Label>
                                <Input
                                  id={`${element.id}-h`}
                                  type="number"
                                  value={Math.round(element.size.height)}
                                  onChange={(e) => {
                                    const newH =
                                      parseFloat(e.target.value) || 0;
                                    handleUpdateElementSize(
                                      selectedPageId,
                                      element.id,
                                      element.size.width,
                                      newH
                                    );
                                  }}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    e.target.select();
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="h-8 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Layer */}
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold text-gray-600">
                            Lớp:
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={element.layer}
                              onChange={(e) => {
                                const newLayer = parseInt(e.target.value) || 0;
                                const pageIndex = pages.findIndex(
                                  (p) => p.id === selectedPageId
                                );
                                if (pageIndex !== -1) {
                                  const updatedPages = [...pages];
                                  const elementIndex = updatedPages[
                                    pageIndex
                                  ].elements.findIndex(
                                    (el) => el.id === element.id
                                  );
                                  if (elementIndex !== -1) {
                                    updatedPages[pageIndex].elements[
                                      elementIndex
                                    ].layer = Math.max(0, newLayer);
                                    setPages(updatedPages);
                                  }
                                }
                              }}
                              onFocus={(e) => {
                                e.stopPropagation();
                                e.target.select();
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="h-7 w-16 text-xs text-center"
                              onClick={(e) => e.stopPropagation()}
                              min={0}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(
                                  selectedPageId,
                                  element.id,
                                  "up"
                                );
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLayer(
                                  selectedPageId,
                                  element.id,
                                  "down"
                                );
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Chọn trang để xem thành phần</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white shadow-md border-b border-gray-200">
          {/* Header with Back Button */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Quay lại</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {book.title}
                </h2>
                <p className="text-sm text-gray-500">
                  Chỉnh sửa và quản lý nội dung sách
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Book Button */}
              <button
                onClick={handleSaveBook}
                disabled={saving}
                className={`
    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
    ${
      saving
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : "bg-green-500 hover:bg-green-600 text-white"
    }
  `}
              >
                <Save className="w-5 h-5" />
                <span className="font-medium">
                  {saving ? "Đang lưu..." : "Lưu sách"}
                </span>
              </button>

              {/* Delete Book Button */}
              <button
                onClick={handleDeleteBook}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Xóa Sách</span>
              </button>

              {/* Toggle Resource Panel Button */}
              <button
                onClick={() => setIsResourcePanelOpen(!isResourcePanelOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isResourcePanelOpen
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isResourcePanelOpen ? (
                  <>
                    <PanelRightClose className="w-5 h-5" />
                    <span className="font-medium">Đóng Tài Nguyên</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-5 h-5" />
                    <span className="font-medium">Mở Tài Nguyên</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Toolbar Options */}
          <div className="px-6 py-3 flex items-center gap-6">
            {/* Add Page Button */}
            <button
              onClick={handleAddPage}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Tạo Trang</span>
            </button>

            {/* AI Generate Button */}
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <Wand2 className="w-4 h-4" />
              <span className="font-medium">Tạo bằng AI</span>
            </button>

            <div className="h-8 w-px bg-gray-300" />

            {/* Page Size */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium">Kích thước:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageSize("a4")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageSize === "a4"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  A4
                </button>
                <button
                  onClick={() => setPageSize("a5")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pageSize === "a5"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  A5
                </button>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-300" />

            {/* Page Orientation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Chiều trang:</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrientation("portrait")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    orientation === "portrait"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Dọc
                </button>
                <button
                  onClick={() => setOrientation("landscape")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    orientation === "landscape"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Ngang
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pages Content Area */}
        <div className="flex-1 overflow-auto bg-gray-200 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className={`mx-auto bg-white shadow-lg relative cursor-pointer border-4 transition-all ${
                  selectedPageId === page.id
                    ? "border-blue-500"
                    : "border-transparent hover:border-gray-300"
                }`}
                style={{
                  width: `${pageDimensions.width}px`,
                  height: `${pageDimensions.height}px`,
                }}
                onClick={() => {
                  setSelectedPageId(page.id);
                  setSelectedElementId(null);
                }}
              >
                {/* Page Number */}
                <div className="absolute top-4 right-4 text-gray-400 text-sm z-10">
                  Trang {index + 1}
                </div>

                {/* Delete Page Icon - Shown when page is selected */}
                {selectedPageId === page.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    className="absolute top-4 left-4 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all hover:scale-110"
                    title="Xóa trang này"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                {/* Grid overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Page Elements */}
                <div className="absolute inset-0">
                  {page.elements
                    .sort((a, b) => a.layer - b.layer)
                    .map((element) => {
                      if (!element.visible) return null;

                      if (element.type === "background") {
                        return (
                          <div
                            key={element.id}
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url(${element.data.url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        );
                      }

                      if (element.type === "chessboard") {
                        return (
                          <div
                            key={element.id}
                            className="absolute cursor-move"
                            style={{
                              left: `${element.position.x}px`,
                              top: `${element.position.y}px`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(element.id);
                            }}
                          >
                            <Resizable
                              size={{
                                width: element.size.width,
                                height: element.size.height,
                              }}
                              onResizeStop={(e, direction, ref, d) => {
                                handleUpdateElementSize(
                                  page.id,
                                  element.id,
                                  element.size.width + d.width,
                                  element.size.height + d.height
                                );
                              }}
                              className={`${
                                selectedElementId === element.id
                                  ? "ring-2 ring-blue-500"
                                  : ""
                              }`}
                              enable={{
                                top: false,
                                right: true,
                                bottom: true,
                                left: false,
                                topRight: false,
                                bottomRight: true,
                                bottomLeft: false,
                                topLeft: false,
                              }}
                              lockAspectRatio={true}
                            >
                            <div className="w-full h-full relative">
                              {/* Chessboard with border and coordinates */}
                              <div className="absolute inset-0 border-2 border-gray-700 rounded-md shadow-sm">
                                {/* Column labels (A-H) - Top */}
                                {selectedElementId === element.id && (
                                  <>
                                    {/* Column labels top */}
                                    <div className="absolute -top-5 left-0 right-0 flex text-[10px] text-gray-600">
                                      {[
                                        "A",
                                        "B",
                                        "C",
                                        "D",
                                        "E",
                                        "F",
                                        "G",
                                        "H",
                                      ].map((l) => (
                                        <div
                                          key={l}
                                          className="flex-1 text-center"
                                        >
                                          {l}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Row labels left */}
                                    <div className="absolute -left-5 top-0 bottom-0 flex flex-col text-[10px] text-gray-600">
                                      {[8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                                        <div
                                          key={n}
                                          className="flex-1 flex items-center justify-center"
                                        >
                                          {n}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}

                                {/* Chessboard grid */}
                                <div
                                  className="w-full h-full grid grid-cols-8"
                                  onMouseDown={(e) => {
                                    if (e.button !== 0) return;
                                    e.stopPropagation();

                                    const startX =
                                      e.clientX - element.position.x;
                                    const startY =
                                      e.clientY - element.position.y;

                                    const handleMouseMove = (
                                      moveEvent: MouseEvent
                                    ) => {
                                      const newX = moveEvent.clientX - startX;
                                      const newY = moveEvent.clientY - startY;
                                      handleUpdateElementPosition(
                                        page.id,
                                        element.id,
                                        newX,
                                        newY
                                      );
                                    };

                                    const handleMouseUp = () => {
                                      document.removeEventListener(
                                        "mousemove",
                                        handleMouseMove
                                      );
                                      document.removeEventListener(
                                        "mouseup",
                                        handleMouseUp
                                      );
                                    };

                                    document.addEventListener(
                                      "mousemove",
                                      handleMouseMove
                                    );
                                    document.addEventListener(
                                      "mouseup",
                                      handleMouseUp
                                    );
                                  }}
                                >
                                  {Array.from({ length: 64 }).map(
                                    (_, index) => {
                                      const row = Math.floor(index / 8);
                                      const col = index % 8;
                                      const isLight = (row + col) % 2 === 0;
                                      return (
                                        <div
                                          key={index}
                                          style={{
                                            backgroundColor: isLight
                                              ? element.data.color1
                                              : element.data.color2,
                                          }}
                                          className="w-full h-full cursor-pointer hover:opacity-80"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              pendingChessPiece ||
                                              pendingMarker
                                            ) {
                                              handleChessCellClick(
                                                element.id,
                                                row,
                                                col
                                              );
                                            }
                                          }}
                                        />
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>
                            </Resizable>
                          </div>
                        );
                      }

                      if (element.type === "chess-piece") {
                        const pieceDef = chessPieces.find(
                          (p) => p.id === element.data?.pieceId
                        );

                        if (!pieceDef) {
                          console.warn("❌ Invalid chess piece:", element);
                          return null;
                        }

                        const isWhite = element.data.side === "a";
                        const symbol = isWhite
                          ? pieceDef.whiteSymbol
                          : pieceDef.blackSymbol;

                        return (
                          <div
                            key={element.id}
                            className={`absolute cursor-move ${
                              selectedElementId === element.id
                                ? "ring-2 ring-blue-500 rounded-md"
                                : ""
                            }`}
                            style={{
                              left: element.position.x,
                              top: element.position.y,
                              width: element.size.width,
                              height: element.size.height,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(element.id);
                            }}
                            onMouseDown={(e) => {
                              if (e.button !== 0) return;
                              e.stopPropagation();

                              const startX = e.clientX - element.position.x;
                              const startY = e.clientY - element.position.y;

                              const handleMouseMove = (ev: MouseEvent) => {
                                handleUpdateElementPosition(
                                  page.id,
                                  element.id,
                                  ev.clientX - startX,
                                  ev.clientY - startY
                                );
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener(
                                  "mousemove",
                                  handleMouseMove
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  handleMouseUp
                                );
                              };

                              document.addEventListener(
                                "mousemove",
                                handleMouseMove
                              );
                              document.addEventListener(
                                "mouseup",
                                handleMouseUp
                              );
                            }}
                          >
                            <div
                              className="w-full h-full flex items-center justify-center rounded-md"
                              style={{
                                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              }}
                            >
                              <span
                                className={`text-2xl ${
                                  isWhite ? "text-gray-800" : "text-gray-100"
                                }`}
                              >
                                {symbol}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (element.type === "chess-marker") {
                        const markerDef = chessMarkers.find(
                          (m) => m.id === element.data?.markerId
                        );
                        if (!markerDef) return null;

                        const IconComponent = markerDef.icon;

                        const isDot = markerDef.id === "dot";

                        return (
                          <div
                            key={element.id}
                            className={`absolute cursor-move ${
                              selectedElementId === element.id
                                ? "ring-2 ring-blue-400 rounded-full"
                                : ""
                            }`}
                            style={{
                              left: element.position.x,
                              top: element.position.y,
                              width: element.size.width,
                              height: element.size.height,
                              opacity: 0.85,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(element.id);
                            }}
                            onMouseDown={(e) => {
                              if (e.button !== 0) return;
                              e.stopPropagation();

                              const startX = e.clientX - element.position.x;
                              const startY = e.clientY - element.position.y;

                              const handleMouseMove = (ev: MouseEvent) => {
                                handleUpdateElementPosition(
                                  page.id,
                                  element.id,
                                  ev.clientX - startX,
                                  ev.clientY - startY
                                );
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener(
                                  "mousemove",
                                  handleMouseMove
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  handleMouseUp
                                );
                              };

                              document.addEventListener(
                                "mousemove",
                                handleMouseMove
                              );
                              document.addEventListener(
                                "mouseup",
                                handleMouseUp
                              );
                            }}
                          >
                            {isDot ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                  className="w-4 h-4 rounded-full bg-green-500"
                                  style={{
                                    boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                                  }}
                                />
                              </div>
                            ) : (
                              <IconComponent
                                className={`w-full h-full ${
                                  markerDef.color === "green"
                                    ? "text-green-500"
                                    : "text-blue-500"
                                }`}
                                strokeWidth={1.8}
                              />
                            )}
                          </div>
                        );
                      }

                      if (element.type === "image") {
                        return (
                          <div
                            key={element.id}
                            className="absolute cursor-move"
                            style={{
                              left: element.position.x,
                              top: element.position.y,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(element.id);
                            }}
                          >
                            <Resizable
                              size={element.size}
                              onResizeStop={(e, d, ref, delta) => {
                                handleUpdateElementSize(
                                  page.id,
                                  element.id,
                                  element.size.width + delta.width,
                                  element.size.height + delta.height
                                );
                              }}
                              className={selectedElementId === element.id ? "ring-2 ring-blue-500" : ""}
                            >
                              <img
                                src={element.data.url}
                                className={`w-full h-full object-contain pointer-events-none ${
                                  selectedElementId === element.id
                                    ? "ring-2 ring-blue-500"
                                    : ""
                                }`}
                                onMouseDown={(e) => {
                                  if (e.button !== 0) return;
                                  e.stopPropagation();

                                  const startX = e.clientX - element.position.x;
                                  const startY = e.clientY - element.position.y;

                                  const handleMouseMove = (ev: MouseEvent) => {
                                    handleUpdateElementPosition(
                                      page.id,
                                      element.id,
                                      ev.clientX - startX,
                                      ev.clientY - startY
                                    );
                                  };

                                  const handleMouseUp = () => {
                                    document.removeEventListener(
                                      "mousemove",
                                      handleMouseMove
                                    );
                                    document.removeEventListener(
                                      "mouseup",
                                      handleMouseUp
                                    );
                                  };

                                  document.addEventListener(
                                    "mousemove",
                                    handleMouseMove
                                  );
                                  document.addEventListener(
                                    "mouseup",
                                    handleMouseUp
                                  );
                                }}
                              />
                            </Resizable>
                          </div>
                        );
                      }

                      if (element.type === "text") {
                        return (
                          <div
                            key={element.id}
                            className={`absolute cursor-move ${
                              selectedElementId === element.id
                                ? "ring-2 ring-blue-500 p-1"
                                : "p-1"
                            }`}
                            style={{
                              left: element.position.x,
                              top: element.position.y,
                              width: element.size.width,
                              height: element.size.height,
                              fontSize: element.data.fontSize,
                              fontWeight: element.data.fontWeight,
                              border: selectedElementId === element.id ? "2px solid #3b82f6" : "2px dashed #d1d5db",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedElementId(element.id);
                            }}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const updated = [...pages];
                              const pageIndex = updated.findIndex(
                                (p) => p.id === page.id
                              );
                              const elementIndex = updated[
                                pageIndex
                              ].elements.findIndex((el) => el.id === element.id);
                              if (elementIndex !== -1) {
                                const el = updated[pageIndex].elements[elementIndex];
                                if (el.type === "text") {
                                  el.data.text = e.currentTarget.innerText;
                                  setPages(updated);
                                }
                              }
                            }}
                            onMouseDown={(e) => {
                              if (e.button !== 0) return;
                              if ((e.target as HTMLElement).contentEditable === "true" && e.detail === 1) return;

                              e.stopPropagation();

                              const startX = e.clientX - element.position.x;
                              const startY = e.clientY - element.position.y;

                              const handleMouseMove = (ev: MouseEvent) => {
                                handleUpdateElementPosition(
                                  page.id,
                                  element.id,
                                  ev.clientX - startX,
                                  ev.clientY - startY
                                );
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener(
                                  "mousemove",
                                  handleMouseMove
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  handleMouseUp
                                );
                              };

                              document.addEventListener(
                                "mousemove",
                                handleMouseMove
                              );
                              document.addEventListener(
                                "mouseup",
                                handleMouseUp
                              );
                            }}
                          >
                            {element.data.text}
                          </div>
                        );
                      }

                      return null;
                    })}
                </div>

                {/* Empty state */}
                {page.elements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-400 text-lg">{page.content}</p>
                    <p className="text-gray-300 text-sm mt-2">
                      Click để chọn trang này
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Tổng số trang: {pages.length}</span>
            <span>
              {selectedPageId
                ? `Đang chọn: Trang ${selectedPageId}${
                    pendingChessPiece
                      ? " - Chọn ô cờ để đặt quân"
                      : pendingMarker
                      ? " - Chọn ô cờ để đặt marker"
                      : ""
                  }`
                : "Chưa chọn trang"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Resource Panel */}
      <div
        className={`bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
          isResourcePanelOpen ? "w-80" : "w-0"
        }`}
      >
        <div className="w-80 h-full flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Tài Nguyên</h3>
            <p className="text-sm text-gray-500">
              Chọn tài nguyên để thêm vào trang
            </p>
          </div>

          {/* Folders List */}
          {!selectedFolder ? (
            <div className="flex-1 overflow-auto p-4 min-h-0">
              <div className="space-y-2">
                {resourceFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`${folder.color} p-2 rounded-lg text-white`}
                      >
                        {folder.icon}
                      </div>
                      <span className="font-medium text-gray-700">
                        {folder.name}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Folder Items View
            <div className="flex-1 flex flex-col min-h-0">
              {/* Back Button */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => {
                    setSelectedFolder(null);
                    setPendingChessPiece(null);
                    setPendingMarker(null);
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Quay lại</span>
                </button>
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-auto p-4 min-h-0">
                {selectedFolder === "chessboard" ? (
                  // Chessboard Color Picker
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Màu ô sáng:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={chessColor1}
                          onChange={(e) => setChessColor1(e.target.value)}
                          className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={chessColor1}
                          onChange={(e) => setChessColor1(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Màu ô tối:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={chessColor2}
                          onChange={(e) => setChessColor2(e.target.value)}
                          className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={chessColor2}
                          onChange={(e) => setChessColor2(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* Chessboard Preview */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Xem trước:
                      </label>
                      <div
                        className="aspect-square border-4 border-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleAddChessboard}
                      >
                        <div className="grid grid-cols-8 h-full">
                          {Array.from({ length: 64 }).map((_, index) => {
                            const row = Math.floor(index / 8);
                            const col = index % 8;
                            const isLight = (row + col) % 2 === 0;
                            return (
                              <div
                                key={index}
                                style={{
                                  backgroundColor: isLight
                                    ? chessColor1
                                    : chessColor2,
                                }}
                                className="w-full h-full"
                              />
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Click để thêm vào trang
                      </p>
                    </div>

                    {/* Preset Colors */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Màu mẫu:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setChessColor1("#f0d9b5");
                            setChessColor2("#b58863");
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                        >
                          Cổ điển
                        </button>
                        <button
                          onClick={() => {
                            setChessColor1("#eeeed2");
                            setChessColor2("#769656");
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                        >
                          Xanh lá
                        </button>
                        <button
                          onClick={() => {
                            setChessColor1("#e8e8e8");
                            setChessColor2("#4a4a4a");
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                        >
                          Xám
                        </button>
                        <button
                          onClick={() => {
                            setChessColor1("#ffd1a0");
                            setChessColor2("#8b4513");
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                        >
                          Nâu
                        </button>
                      </div>
                    </div>

                    {/* Chess Pieces Sections */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">
                        Quân Cờ
                      </h4>

                      {pendingChessPiece && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Đã chọn: {pendingChessPiece.piece.name} (
                            {pendingChessPiece.side === "a" ? "Trắng" : "Đen"})
                          </p>
                          <button
                            onClick={() => setPendingChessPiece(null)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                          >
                            Hủy chọn
                          </button>
                        </div>
                      )}

                      {/* Display pieces */}
                      <div className="space-y-6">
                        {/* Side A (White) */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                            Bên A (Trắng)
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            {chessPieces.map((piece) => {
                              return (
                                <div
                                  key={`a-${piece.id}`}
                                  className="cursor-pointer group"
                                  onClick={() =>
                                    handleChessPieceClick(piece, "a")
                                  }
                                >
                                  <div className="aspect-square rounded-lg flex items-center justify-center hover:border-blue-400 transition-all p-4 mb-1">
                                    <span className="text-4xl group-hover:scale-110 transition-all duration-300">
                                      {piece.whiteSymbol}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 text-center truncate">
                                    {piece.name}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Side B (Black) */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                            Bên B (Đen)
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            {chessPieces.map((piece) => {
                              return (
                                <div
                                  key={`b-${piece.id}`}
                                  className="cursor-pointer group"
                                  onClick={() =>
                                    handleChessPieceClick(piece, "b")
                                  }
                                >
                                  <div className="aspect-square rounded-lg flex items-center justify-center hover:border-blue-400 transition-all p-4 mb-1">
                                    <span className="text-4xl text-gray-800 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300">
                                      {piece.blackSymbol}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 text-center truncate">
                                    {piece.name}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chess Markers Section */}
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">
                        Ký Hiệu & Mũi Tên
                      </h4>

                      {pendingMarker && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
                          <p className="text-sm text-green-800">
                            Đã chọn: {pendingMarker.marker.name}
                          </p>
                          <button
                            onClick={() => setPendingMarker(null)}
                            className="mt-2 text-xs text-green-600 hover:text-green-700"
                          >
                            Hủy chọn
                          </button>
                        </div>
                      )}

                      {/* Display markers */}
                      <div className="grid grid-cols-3 gap-2">
                        {chessMarkers.map((marker) => {
                          const IconComponent = marker.icon;
                          return (
                            <div
                              key={marker.id}
                              className="cursor-pointer group"
                              onClick={() => handleMarkerClick(marker)}
                            >
                              <div
                                className={`aspect-square rounded-lg flex items-center justify-center border-2 hover:border-blue-400 transition-all p-4 mb-1 ${
                                  marker.color === "green"
                                    ? "bg-green-50 border-green-200"
                                    : "bg-blue-50 border-blue-200"
                                }`}
                              >
                                <IconComponent
                                  className={`w-full h-full group-hover:scale-110 transition-all duration-300 ${
                                    marker.color === "green"
                                      ? "text-green-500"
                                      : "text-blue-500"
                                  }`}
                                  strokeWidth={3}
                                />
                              </div>
                              <p className="text-xs text-gray-600 text-center truncate">
                                {marker.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : selectedFolder === "text" ? (
                  // Text UI
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAddText("title")}
                      className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                    >
                      ➕ Thêm Tiêu đề
                    </button>

                    <button
                      onClick={() => handleAddText("body")}
                      className="w-full px-4 py-3 bg-emerald-400 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                    >
                      ➕ Thêm Nội dung
                    </button>
                  </div>
                ) : selectedFolder === "backgrounds" ? (
                  // Backgrounds Grid
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const items = (resourceFolders
                        .find((f) => f.id === selectedFolder)
                        ?.items || []).filter(isIconItem);
                      return items.map((item) => (
                        <div
                          key={item.id}
                          className="cursor-pointer group"
                          onClick={() => handleAddBackground(item as unknown as Icon)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-xs text-gray-600 text-center truncate">
                            {item.name}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  // Regular Items Grid (for icons, backgrounds, etc. with URLs)
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const items = (resourceFolders
                        .find((f) => f.id === selectedFolder)
                        ?.items || []).filter(isIconItem);
                      return items.map((item) => (
                        <div
                          key={item.id}
                          className="cursor-pointer group"
                          onClick={() => handleAddImage(item as unknown as Icon)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-xs text-gray-600 text-center truncate">
                            {item.name}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Tạo Sách bằng AI
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tạo nhiều trang dựa trên template và prompt AI
                </p>
              </div>
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              {/* Configuration Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Cấu hình
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Kích thước trang
                    </Label>
                    <div className="mt-1 px-3 py-2 bg-white rounded border border-gray-300 text-sm font-medium">
                      {pageSize === "a4" ? "A4" : "A5"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Chiều trang
                    </Label>
                    <div className="mt-1 px-3 py-2 bg-white rounded border border-gray-300 text-sm font-medium">
                      {orientation === "portrait" ? "Dọc" : "Ngang"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Số trang sẽ tạo
                    </Label>
                    <div className="space-y-2">
                      {/* Mode Selection */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAiPageCountMode("fixed")}
                          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                            aiPageCountMode === "fixed"
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Số cố định
                        </button>
                        <button
                          onClick={() => setAiPageCountMode("auto")}
                          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                            aiPageCountMode === "auto"
                              ? "bg-purple-500 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Tự động
                        </button>
                      </div>

                      {/* Input field - only shown for fixed mode */}
                      {aiPageCountMode === "fixed" && (
                        <Input
                          id="page-count"
                          type="number"
                          min={1}
                          max={50}
                          value={aiPageCount}
                          onChange={(e) =>
                            setAiPageCount(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                        />
                      )}

                      {/* Auto mode info */}
                      {aiPageCountMode === "auto" && (
                        <div className="px-2 py-1.5 bg-purple-100 text-purple-700 rounded text-xs">
                          AI sẽ tự động quyết định số trang dựa trên prompt
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Section */}
              <div className="mb-6">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Trang Mẫu (Template)
                      </h3>
                      <p className="text-sm text-gray-500">
                        Thêm bàn cờ vào trang mẫu. Các trang mới sẽ có cấu trúc
                        giống trang mẫu này.
                      </p>
                    </div>
                  </div>

                  {/* Chessboard Style Selector */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                    <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Chọn Style Bàn Cờ
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(chessStylePresets).map(
                        ([key, preset]) => (
                          <button
                            key={key}
                            onClick={() => setTemplateChessStyle(key as any)}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              templateChessStyle === key
                                ? "border-amber-500 bg-white shadow-md"
                                : "border-gray-300 bg-white hover:border-amber-300"
                            }`}
                          >
                            {/* Mini chessboard preview */}
                            <div className="aspect-square grid grid-cols-4 mb-1 rounded overflow-hidden">
                              {Array.from({ length: 16 }).map((_, i) => {
                                const row = Math.floor(i / 4);
                                const col = i % 4;
                                const isLight = (row + col) % 2 === 0;
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      backgroundColor: isLight
                                        ? preset.color1
                                        : preset.color2,
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <p
                              className={`text-xs text-center font-medium ${
                                templateChessStyle === key
                                  ? "text-amber-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {preset.name}
                            </p>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Add Chessboard Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddChessboardToTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                    >
                      <Grid3x3 className="w-4 h-4" />
                      Thêm Bàn Cờ ({chessStylePresets[templateChessStyle].name})
                    </button>
                  </div>
                </div>

                {/* Template Editor with Left Panel and Preview */}
                <div className="flex gap-4">
                  {/* Left Panel - Element Info */}
                  <div className="w-72 bg-white border-2 border-gray-300 rounded-lg p-4 max-h-[600px] overflow-auto">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Thành Phần Template
                    </h4>

                    {aiTemplate.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Grid3x3 className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Chưa có thành phần nào</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {aiTemplate
                          .sort((a, b) => b.layer - a.layer)
                          .map((element) => (
                            <div
                              key={element.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedAIElementId === element.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedAIElementId(element.id)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  {element.type === "chessboard" && "♟️ Bàn cờ"}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplateElement(element.id);
                                    if (selectedAIElementId === element.id) {
                                      setSelectedAIElementId(null);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>

                              {/* Editable Properties */}
                              {element.type === "chessboard" && (
                                <div className="space-y-3">
                                  {/* Position */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                      Vị trí (px)
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label
                                          htmlFor={`template-${element.id}-x`}
                                          className="text-xs text-gray-500"
                                        >
                                          X:
                                        </Label>
                                        <Input
                                          id={`template-${element.id}-x`}
                                          type="number"
                                          value={Math.round(element.position.x)}
                                          onChange={(e) => {
                                            const newX =
                                              parseFloat(e.target.value) || 0;
                                            handleUpdateTemplateElementPosition(
                                              element.id,
                                              newX,
                                              element.position.y
                                            );
                                          }}
                                          onFocus={(e) => {
                                            e.stopPropagation();
                                            e.target.select();
                                          }}
                                          onMouseDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          className="h-8 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <Label
                                          htmlFor={`template-${element.id}-y`}
                                          className="text-xs text-gray-500"
                                        >
                                          Y:
                                        </Label>
                                        <Input
                                          id={`template-${element.id}-y`}
                                          type="number"
                                          value={Math.round(element.position.y)}
                                          onChange={(e) => {
                                            const newY =
                                              parseFloat(e.target.value) || 0;
                                            handleUpdateTemplateElementPosition(
                                              element.id,
                                              element.position.x,
                                              newY
                                            );
                                          }}
                                          onFocus={(e) => {
                                            e.stopPropagation();
                                            e.target.select();
                                          }}
                                          onMouseDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          className="h-8 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Size */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                      Kích thước (px)
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label
                                          htmlFor={`template-${element.id}-w`}
                                          className="text-xs text-gray-500"
                                        >
                                          W:
                                        </Label>
                                        <Input
                                          id={`template-${element.id}-w`}
                                          type="number"
                                          value={Math.round(element.size.width)}
                                          onChange={(e) => {
                                            const newWidth =
                                              parseFloat(e.target.value) || 0;
                                            handleUpdateTemplateElementSize(
                                              element.id,
                                              newWidth,
                                              newWidth
                                            );
                                          }}
                                          onFocus={(e) => {
                                            e.stopPropagation();
                                            e.target.select();
                                          }}
                                          onMouseDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          className="h-8 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <Label
                                          htmlFor={`template-${element.id}-h`}
                                          className="text-xs text-gray-500"
                                        >
                                          H:
                                        </Label>
                                        <Input
                                          id={`template-${element.id}-h`}
                                          type="number"
                                          value={Math.round(
                                            element.size.height
                                          )}
                                          onChange={(e) => {
                                            const newHeight =
                                              parseFloat(e.target.value) || 0;
                                            handleUpdateTemplateElementSize(
                                              element.id,
                                              newHeight,
                                              newHeight
                                            );
                                          }}
                                          onFocus={(e) => {
                                            e.stopPropagation();
                                            e.target.select();
                                          }}
                                          onMouseDown={(e) =>
                                            e.stopPropagation()
                                          }
                                          className="h-8 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Layer */}
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">
                                      Layer
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">
                                        {element.layer}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Template Page Preview */}
                  <div className="flex-1 border-2 border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto">
                    <div
                      className="bg-white shadow-lg mx-auto relative"
                      style={{
                        width: `${pageDimensions.width}px`,
                        height: `${pageDimensions.height}px`,
                      }}
                    >
                      {/* Grid overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `
                          linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                        `,
                          backgroundSize: "20px 20px",
                        }}
                      />

                      {/* Template Elements */}
                      {aiTemplate
                        .sort((a, b) => a.layer - b.layer)
                        .map((element) => {
                          if (element.type === "chessboard") {
                            return (
                              <Resizable
                                key={element.id}
                                size={{
                                  width: element.size.width,
                                  height: element.size.height,
                                }}
                                onResizeStop={(e, direction, ref, d) => {
                                  handleUpdateTemplateElementSize(
                                    element.id,
                                    element.size.width + d.width,
                                    element.size.height + d.height
                                  );
                                }}
                                lockAspectRatio
                                enable={{
                                  top: false,
                                  right: true,
                                  bottom: true,
                                  left: false,
                                  topRight: false,
                                  bottomRight: true,
                                  bottomLeft: false,
                                  topLeft: false,
                                }}
                                style={{
                                  position: "absolute",
                                  left: element.position.x,
                                  top: element.position.y,
                                }}
                              >
                                <div
                                  className="w-full h-full cursor-move"
                                  onMouseDown={(e) => {
                                    if (e.button !== 0) return;
                                    e.stopPropagation();

                                    const startX =
                                      e.clientX - element.position.x;
                                    const startY =
                                      e.clientY - element.position.y;

                                    const handleMouseMove = (
                                      moveEvent: MouseEvent
                                    ) => {
                                      const newX = moveEvent.clientX - startX;
                                      const newY = moveEvent.clientY - startY;
                                      handleUpdateTemplateElementPosition(
                                        element.id,
                                        newX,
                                        newY
                                      );
                                    };

                                    const handleMouseUp = () => {
                                      document.removeEventListener(
                                        "mousemove",
                                        handleMouseMove
                                      );
                                      document.removeEventListener(
                                        "mouseup",
                                        handleMouseUp
                                      );
                                    };

                                    document.addEventListener(
                                      "mousemove",
                                      handleMouseMove
                                    );
                                    document.addEventListener(
                                      "mouseup",
                                      handleMouseUp
                                    );
                                  }}
                                  onClick={() =>
                                    setSelectedAIElementId(element.id)
                                  }
                                >
                                  <div
                                    className={`w-full h-full grid grid-cols-8 grid-rows-8 border-2 ${
                                      selectedAIElementId === element.id
                                        ? "border-blue-500"
                                        : "border-gray-800"
                                    }`}
                                  >
                                    {Array.from({ length: 64 }).map(
                                      (_, idx) => {
                                        const row = Math.floor(idx / 8);
                                        const col = idx % 8;
                                        const isLight = (row + col) % 2 === 0;
                                        return (
                                          <div
                                            key={idx}
                                            className="relative"
                                            style={{
                                              backgroundColor: isLight
                                                ? element.data.color1
                                                : element.data.color2,
                                            }}
                                          />
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </Resizable>
                            );
                          }

                          return null;
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Section */}
              <div className="mb-6">
                <Label
                  htmlFor="ai-prompt"
                  className="text-lg font-semibold text-gray-800 mb-2 block"
                >
                  Prompt AI
                </Label>
                <p className="text-sm text-gray-500 mb-3">
                  Mô tả nội dung bạn muốn tạo. Ví dụ: "Chặn nước chiếu bằng quân
                  tượng"
                </p>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Nhập mô tả cho AI..."
                  className="min-h-32"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateWithAI}
                disabled={!aiPrompt.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-5 h-5" />
                <span className="font-medium">Tạo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
