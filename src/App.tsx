import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GridMode, ParchiItem, ParchiHouse } from './types';
import { Share } from '@capacitor/share';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeJantriPluginType {
  shareImage(options: { base64: string; fileName: string }): Promise<{ success: boolean }>;
  downloadImage(options: { base64: string; fileName: string }): Promise<{ success: boolean }>;
}

const NativeJantri = registerPlugin<NativeJantriPluginType>('NativeJantri');
import {
  RotateCcw,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Loader2,
  ArrowLeft,
  LogOut,
  Key,
  Shield,
  User,
  AlertCircle,
} from 'lucide-react';

import { UserProfile } from './types';
import {
  getStoredUser,
  logoutUser,
  subscribeToUserSession,
} from './services/authService';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminPanelModal } from './components/AdminPanelModal';

interface JantriTheme {
  name: string;
  headerBg: string;
  badgeBg: string;
  emptyBadgeBg: string;
  borderColor: string;
  accentText: string;
  activeCellBg: string;
  amountText: string;
  tabActive: string;
  tabInactive: string;
}

const JANTRI_THEMES: JantriTheme[] = [
  {
    name: 'Royal Blue',
    headerBg: 'bg-gradient-to-r from-blue-700 to-indigo-800',
    badgeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    emptyBadgeBg: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    accentText: 'text-blue-700',
    activeCellBg: 'bg-blue-50/80',
    amountText: 'text-blue-950',
    tabActive: 'bg-blue-700 text-white border-blue-800 shadow-sm',
    tabInactive: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
  },
  {
    name: 'Emerald Green',
    headerBg: 'bg-gradient-to-r from-emerald-700 to-teal-800',
    badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    emptyBadgeBg: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-300',
    accentText: 'text-emerald-700',
    activeCellBg: 'bg-emerald-50/80',
    amountText: 'text-emerald-950',
    tabActive: 'bg-emerald-700 text-white border-emerald-800 shadow-sm',
    tabInactive: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  {
    name: 'Ruby Crimson',
    headerBg: 'bg-gradient-to-r from-rose-700 to-red-800',
    badgeBg: 'bg-gradient-to-r from-rose-600 to-red-600 text-white',
    emptyBadgeBg: 'bg-rose-100 text-rose-800',
    borderColor: 'border-rose-300',
    accentText: 'text-rose-700',
    activeCellBg: 'bg-rose-50/80',
    amountText: 'text-rose-950',
    tabActive: 'bg-rose-700 text-white border-rose-800 shadow-sm',
    tabInactive: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
  },
  {
    name: 'Amber Gold',
    headerBg: 'bg-gradient-to-r from-amber-600 to-orange-700',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    emptyBadgeBg: 'bg-amber-100 text-amber-800',
    borderColor: 'border-amber-300',
    accentText: 'text-amber-700',
    activeCellBg: 'bg-amber-50/80',
    amountText: 'text-amber-950',
    tabActive: 'bg-amber-600 text-white border-amber-700 shadow-sm',
    tabInactive: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
  },
  {
    name: 'Deep Purple',
    headerBg: 'bg-gradient-to-r from-purple-700 to-violet-800',
    badgeBg: 'bg-gradient-to-r from-purple-600 to-violet-600 text-white',
    emptyBadgeBg: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    accentText: 'text-purple-700',
    activeCellBg: 'bg-purple-50/80',
    amountText: 'text-purple-950',
    tabActive: 'bg-purple-700 text-white border-purple-800 shadow-sm',
    tabInactive: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
  },
  {
    name: 'Cyan Teal',
    headerBg: 'bg-gradient-to-r from-cyan-700 to-teal-800',
    badgeBg: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white',
    emptyBadgeBg: 'bg-cyan-100 text-cyan-800',
    borderColor: 'border-cyan-300',
    accentText: 'text-cyan-700',
    activeCellBg: 'bg-cyan-50/80',
    amountText: 'text-cyan-950',
    tabActive: 'bg-cyan-700 text-white border-cyan-800 shadow-sm',
    tabInactive: 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100',
  },
  {
    name: 'Sunset Orange',
    headerBg: 'bg-gradient-to-r from-orange-600 to-amber-700',
    badgeBg: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white',
    emptyBadgeBg: 'bg-orange-100 text-orange-800',
    borderColor: 'border-orange-300',
    accentText: 'text-orange-700',
    activeCellBg: 'bg-orange-50/80',
    amountText: 'text-orange-950',
    tabActive: 'bg-orange-600 text-white border-orange-700 shadow-sm',
    tabInactive: 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100',
  },
  {
    name: 'Fuchsia Pink',
    headerBg: 'bg-gradient-to-r from-fuchsia-700 to-pink-800',
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white',
    emptyBadgeBg: 'bg-fuchsia-100 text-fuchsia-800',
    borderColor: 'border-fuchsia-300',
    accentText: 'text-fuchsia-700',
    activeCellBg: 'bg-fuchsia-50/80',
    amountText: 'text-fuchsia-950',
    tabActive: 'bg-fuchsia-700 text-white border-fuchsia-800 shadow-sm',
    tabInactive: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200 hover:bg-fuchsia-100',
  },
  {
    name: 'Lime Olive',
    headerBg: 'bg-gradient-to-r from-lime-700 to-emerald-800',
    badgeBg: 'bg-gradient-to-r from-lime-600 to-emerald-600 text-white',
    emptyBadgeBg: 'bg-lime-100 text-lime-800',
    borderColor: 'border-lime-300',
    accentText: 'text-lime-800',
    activeCellBg: 'bg-lime-50/80',
    amountText: 'text-lime-950',
    tabActive: 'bg-lime-700 text-white border-lime-800 shadow-sm',
    tabInactive: 'bg-lime-50 text-lime-900 border-lime-200 hover:bg-lime-100',
  },
  {
    name: 'Midnight Slate',
    headerBg: 'bg-gradient-to-r from-slate-800 to-gray-900',
    badgeBg: 'bg-gradient-to-r from-slate-700 to-gray-800 text-white',
    emptyBadgeBg: 'bg-slate-200 text-slate-800',
    borderColor: 'border-slate-400',
    accentText: 'text-slate-800',
    activeCellBg: 'bg-slate-100/90',
    amountText: 'text-slate-950',
    tabActive: 'bg-slate-800 text-white border-slate-900 shadow-sm',
    tabInactive: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
  },
];

function SingleJantriBoxGrid({
  parchi,
  themeIndex,
  columns,
  gridCells,
  formatWithLeadingZero,
  onShare,
  isSharing = false,
  onDownload,
  isDownloading = false,
}: {
  parchi: ParchiItem;
  themeIndex: number;
  columns: number[];
  gridCells: { label: string; col: number; row: number }[][];
  formatWithLeadingZero: (val: number | string) => string;
  onShare?: () => void;
  isSharing?: boolean;
  onDownload?: () => void;
  isDownloading?: boolean;
}) {
  const theme = JANTRI_THEMES[themeIndex % JANTRI_THEMES.length];

  const parchiMap = useMemo(() => {
    const map = new Map<string, number>();
    parchi.houses.forEach((h) => {
      map.set(formatWithLeadingZero(h.number), h.amount);
    });
    return map;
  }, [parchi, formatWithLeadingZero]);

  return (
    <div
      id={`jantri-card-capture-${parchi.id}`}
      className={`w-full bg-white rounded-xl border ${theme.borderColor} shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className={`${theme.headerBg} text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-xs gap-2`}>
        <h3 className="text-base sm:text-lg font-bold tracking-wide">
          Jantri #{parchi.parchiNumber}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {onShare && (
            <button
              type="button"
              data-capture-hide="true"
              onClick={onShare}
              disabled={isSharing}
              className="bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-xs disabled:opacity-50"
              title="Share this Jantri"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-white" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              data-capture-hide="true"
              onClick={onDownload}
              disabled={isDownloading}
              className="bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer font-bold shadow-xs disabled:opacity-50"
              title="Download Jantri Image"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 100 Boxes (10x10) + 10 Row Total Cells Grid (11 Columns) */}
      <div className="w-full grid grid-cols-11 border-collapse">
        {/* Column Headers 1 to 10 */}
        {columns.map((colNum) => (
          <div
            key={`col-header-${themeIndex}-${colNum}`}
            className={`${theme.headerBg} py-1 sm:py-1.5 font-bold text-white text-[9.5px] sm:text-xs md:text-sm text-center border-b border-r border-white/20 select-none shadow-2xs`}
          >
            {colNum}
          </div>
        ))}

        {/* 11th Column Header: Total */}
        <div
          key={`col-header-${themeIndex}-total`}
          className="bg-amber-600/95 py-1 sm:py-1.5 font-black text-white text-[9.5px] sm:text-xs md:text-sm text-center border-b border-amber-700/40 select-none shadow-2xs tracking-wide"
        >
          Total
        </div>

        {/* 100 Cells + 10 Row Total Cells (11 columns per row) */}
        {gridCells.flatMap((rowCells, rowIndex) => {
          const rowTotal = rowCells.reduce((sum, cell) => {
            const cellFormatted = formatWithLeadingZero(cell.label);
            return sum + (parchiMap.get(cellFormatted) ?? 0);
          }, 0);

          return [
            ...rowCells.map((cell) => {
              const cellFormatted = formatWithLeadingZero(cell.label);
              const cellAmount = parchiMap.get(cellFormatted) ?? 0;
              const isFilled = cellAmount > 0;

              return (
                <div
                  key={`jantri-${parchi.id}-cell-${cell.label}`}
                  className={`border-b border-r ${theme.borderColor}/50 ${
                    rowIndex === 9 ? 'border-b-0' : ''
                  } ${isFilled ? theme.activeCellBg : 'bg-white hover:bg-gray-50/60'} transition-colors p-[1px] sm:p-1 flex flex-col justify-between min-h-[38px] sm:min-h-[44px]`}
                >
                  {/* Cell Number Badge */}
                  <div className="flex items-center justify-start">
                    <span
                      className={`${
                        isFilled ? theme.badgeBg : (theme.emptyBadgeBg || 'bg-gray-200 text-gray-700')
                      } text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold px-0.5 sm:px-1.5 py-0.5 rounded-xs sm:rounded-sm select-none leading-none shadow-2xs tracking-tight`}
                      title={`Box: ${cell.label}`}
                    >
                      {cell.label}
                    </span>
                  </div>

                  {/* Auto-filled Amount */}
                  <div className="mt-0.5 w-full text-center">
                    {isFilled ? (
                      <span className={`block font-extrabold ${theme.amountText} text-[10px] sm:text-xs md:text-sm tracking-tight truncate`}>
                        {cellAmount}
                      </span>
                    ) : (
                      <span className="block text-gray-300 font-light text-[9.5px] sm:text-xs select-none">
                        -
                      </span>
                    )}
                  </div>
                </div>
              );
            }),
            /* 11th Column: Row Total Cell */
            <div
              key={`jantri-${parchi.id}-row-total-${rowIndex}`}
              className={`border-b border-amber-200/90 bg-amber-50/85 p-[1px] sm:p-1 flex items-center justify-center min-h-[38px] sm:min-h-[44px] ${
                rowIndex === 9 ? 'border-b-0' : ''
              }`}
            >
              <span className="block font-black text-amber-950 font-mono text-[11px] sm:text-xs md:text-sm tracking-tight truncate">
                {rowTotal > 0 ? rowTotal : '-'}
              </span>
            </div>,
          ];
        })}
      </div>

      {/* Footer */}
      <div className="p-2 sm:p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end text-xs sm:text-sm">
        <div className="font-bold text-gray-800">
          Jantri Total: <span className={`font-mono text-sm sm:text-base font-black ${theme.accentText}`}>₹{parchi.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

export interface FastEntryResult {
  amountsMap: Record<number, number>;
  filledCount: number;
  totalSum: number;
}

/**
 * Fast Entry Parser for Parchi / Jantri:
 * Supports:
 * - 01-25, 02-50, 07-90
 * - 12,50,60,08,07&50 (symbols: =, %, #, &, *, -)
 * - Mixed entries, multiple lines, commas or spaces
 */
export function parseFastEntryText(text: string): FastEntryResult {
  const amountsMap: Record<number, number> = {};
  if (!text || !text.trim()) {
    return { amountsMap, filledCount: 0, totalSum: 0 };
  }

  const regex = /([^=\%#&\*\n;:]+?)\s*([=\%#&\*\-:/])\s*([0-9]+(?:\.[0-9]+)?)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawNumbers = match[1];
    const amount = parseFloat(match[3]);

    if (isNaN(amount) || amount < 0) continue;

    const numbers = rawNumbers
      .split(/[\s,./+]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !isNaN(parseInt(s, 10)))
      .map((s) => {
        const n = parseInt(s, 10);
        return n === 0 ? 100 : n;
      })
      .filter((n) => n >= 1 && n <= 100);

    for (const num of numbers) {
      amountsMap[num] = (amountsMap[num] || 0) + amount;
    }
  }

  const filledCount = Object.keys(amountsMap).length;
  const totalSum = Object.values(amountsMap).reduce((a, b) => a + b, 0);

  return { amountsMap, filledCount, totalSum };
}

export default function App() {
  // Amount input for filling Jantri (e.g. 500)
  const [amount, setAmount] = useState<string>('500');
  const [gridMode] = useState<GridMode>('1-100');
  const [parchiNumber, setParchiNumber] = useState<string>('10');
  const [smallAmountsInResult, setSmallAmountsInResult] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedParchis, setGeneratedParchis] = useState<ParchiItem[]>([]);
  const [copiedParchiId, setCopiedParchiId] = useState<number | null>(null);

  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [forceLogoutNotice, setForceLogoutNotice] = useState<string | null>(null);

  // Real-time Single Device Session Enforcement Effect
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserSession(currentUser.phoneNumber, (reason) => {
      logoutUser();
      setCurrentUser(null);
      setShowChangePassword(false);
      setShowAdminPanel(false);
      setIsJantriModalOpen(false);
      setForceLogoutNotice(reason);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Fast Entry Text Box state
  const [customEntryText, setCustomEntryText] = useState<string>('');

  // Memoized parsed data
  const parsedCustomData = useMemo(() => {
    return parseFastEntryText(customEntryText);
  }, [customEntryText]);

  const isCustomMode = customEntryText.trim().length > 0;
  const [jantriViewMode, setJantriViewMode] = useState<'tabs' | 'all'>('tabs');
  const [activeJantriIndex, setActiveJantriIndex] = useState<number>(0);
  const [isJantriModalOpen, setIsJantriModalOpen] = useState<boolean>(false);
  const [sharingJantriId, setSharingJantriId] = useState<number | null>(null);
  const [downloadingJantriId, setDownloadingJantriId] = useState<number | null>(null);

  // Pull down to refresh app
  const [pullY, setPullY] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 5) {
        touchStartY.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;
      if (window.scrollY <= 5) {
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff > 0) {
          const clamped = Math.min(diff * 0.45, 95);
          setPullY(clamped);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      if (pullY > 55) {
        setIsRefreshing(true);
        setPullY(50);
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullY]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isJantriModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsJantriModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJantriModalOpen]);

  // 10 column headers: 1 to 10 (or 0 to 9 in 0-99 mode) without leading zeros
  const columns = useMemo(() => {
    if (gridMode === '0-99') {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }, [gridMode]);

  // Helper to format any number string/number with leading zero if 0-9
  const formatWithLeadingZero = (val: number | string): string => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) return String(val);
    if (num >= 0 && num <= 9) {
      return `0${num}`;
    }
    return String(val);
  };

  // Exactly 100 main grid cells (10 rows x 10 cols)
  const gridCells = useMemo(() => {
    const rows: { label: string; col: number; row: number }[][] = [];

    for (let r = 0; r < 10; r++) {
      const rowCells: { label: string; col: number; row: number }[] = [];
      for (let c = 0; c < 10; c++) {
        let label = '';
        if (gridMode === '1-100') {
          const num = r * 10 + (c + 1);
          label = num <= 9 ? `0${num}` : num.toString();
        } else if (gridMode === '00-99') {
          const num = r * 10 + (c + 1);
          if (num === 100) {
            label = '00';
          } else {
            label = num < 10 ? `0${num}` : num.toString();
          }
        } else {
          // 0 to 99
          const num = r * 10 + c;
          label = num <= 9 ? `0${num}` : num.toString();
        }
        rowCells.push({ label, col: c, row: r });
      }
      rows.push(rowCells);
    }
    return rows;
  }, [gridMode]);

  // Grand Total calculation:
  // If custom text entry is used, sum of all parsed entries; otherwise 100 * amount
  const grandTotal = useMemo(() => {
    if (isCustomMode) {
      return parsedCustomData.totalSum;
    }
    const numericAmount = parseFloat(amount) || 0;
    return numericAmount * 100;
  }, [isCustomMode, parsedCustomData.totalSum, amount]);

  const setPreset = (val: string) => {
    setAmount(val);
  };

  /**
   * Process Parchi Logic:
   * 1. Grand Total = amount * 100 (e.g., 500 * 100 = 50,000).
   * 2. Number of Parchis = count (e.g., 10).
   * 3. Target amount per parchi = grandTotal / count (e.g., ~5,000).
   *    Each parchi total is very close to the target, and sum across all parchis is strictly equal to grandTotal.
   * 4. House numbers strictly between 1 and 100 (never greater than 100).
   * 5. Each parchi has randomly 70 to 80 houses.
   * 6. Amounts distributed in steps of 50 (or 25 if small amounts selected).
   */
  const executeGeneration = (): ParchiItem[] | null => {
    const count = parseInt(parchiNumber, 10);
    if (isNaN(count) || count <= 0) {
      setStatusMessage('Please enter a valid number of parchis (e.g. 10)');
      setTimeout(() => setStatusMessage(null), 3500);
      return null;
    }

    if (grandTotal <= 0) {
      setStatusMessage('Please enter an amount or text entries (e.g. 500 or 01-25)');
      setTimeout(() => setStatusMessage(null), 3500);
      return null;
    }

    const parchiStep = (grandTotal % 5 === 0) ? 5 : 1;
    const exactAverage = grandTotal / count;

    const baseVal = Math.floor(exactAverage / parchiStep) * parchiStep;
    const parchiTotals: number[] = new Array(count).fill(baseVal);

    let remainder = grandTotal - (baseVal * count);
    const availableIndices = Array.from({ length: count }, (_, i) => i);
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    let rIdx = 0;
    while (remainder >= parchiStep) {
      const targetParchi = availableIndices[rIdx % count];
      parchiTotals[targetParchi] += parchiStep;
      remainder -= parchiStep;
      rIdx++;
    }

    const maxDeviation = 10;
    const numSwaps = Math.floor(count * 1.5);
    for (let s = 0; s < numSwaps; s++) {
      const i = Math.floor(Math.random() * count);
      const j = Math.floor(Math.random() * count);
      if (i === j) continue;

      const newTotalI = parchiTotals[i] + parchiStep;
      const newTotalJ = parchiTotals[j] - parchiStep;

      if (
        Math.abs(newTotalI - exactAverage) <= maxDeviation &&
        Math.abs(newTotalJ - exactAverage) <= maxDeviation &&
        newTotalJ > 0
      ) {
        parchiTotals[i] = newTotalI;
        parchiTotals[j] = newTotalJ;
      }
    }

    for (let i = parchiTotals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parchiTotals[i], parchiTotals[j]] = [parchiTotals[j], parchiTotals[i]];
    }

    const availableNumbers: string[] = [];
    for (let i = 1; i <= 100; i++) {
      if (gridMode === '00-99') {
        availableNumbers.push(i === 100 ? '00' : (i < 10 ? `0${i}` : i.toString()));
      } else if (gridMode === '0-99') {
        const val = i - 1;
        availableNumbers.push(val < 10 ? `0${val}` : val.toString());
      } else {
        availableNumbers.push(i < 10 ? `0${i}` : i.toString());
      }
    }

    const parchis: ParchiItem[] = [];
    const lastSeenParchi = new Map<string, number>();
    const appearanceCount = new Map<string, number>();
    availableNumbers.forEach(num => {
      lastSeenParchi.set(num, -1);
      appearanceCount.set(num, 0);
    });

    for (let p = 0; p < count; p++) {
      const thisParchiTotal = parchiTotals[p];
      let targetHousesCount = smallAmountsInResult
        ? Math.floor(Math.random() * 13) + 80
        : Math.floor(Math.random() * 9) + 60;

      let houseStep = 50;
      if (smallAmountsInResult) {
        if (thisParchiTotal >= targetHousesCount * 25) {
          houseStep = 25;
        } else if (thisParchiTotal >= targetHousesCount * 10) {
          houseStep = 10;
        } else if (thisParchiTotal >= targetHousesCount * 5) {
          houseStep = 5;
        } else {
          houseStep = Math.max(1, Math.floor(thisParchiTotal / targetHousesCount));
        }
      } else {
        if (thisParchiTotal >= targetHousesCount * 50) {
          houseStep = 50;
        } else if (thisParchiTotal >= targetHousesCount * 25) {
          houseStep = 25;
        } else if (thisParchiTotal >= targetHousesCount * 10) {
          houseStep = 10;
        } else if (thisParchiTotal >= targetHousesCount * 5) {
          houseStep = 5;
        } else {
          houseStep = Math.max(1, Math.floor(thisParchiTotal / targetHousesCount));
        }
      }

      const maxPossibleHouses = Math.min(100, Math.floor(thisParchiTotal / houseStep));
      if (targetHousesCount > maxPossibleHouses) {
        targetHousesCount = Math.max(1, maxPossibleHouses);
      }

      const scoreNumber = (numStr: string): number => {
        const last = lastSeenParchi.get(numStr) ?? -1;
        const countTimes = appearanceCount.get(numStr) ?? 0;
        let score = 0;
        const gap = p - last;

        if (last === -1) {
          score += 1000;
        } else if (gap >= 2) {
          score += 500 * gap;
        } else if (gap === 1) {
          score += 50;
        }
        score -= countTimes * 25;
        score += Math.random() * 15;
        return score;
      };

      const rankedNumbers = [...availableNumbers].map(numStr => ({
        numStr,
        score: scoreNumber(numStr),
      }));

      rankedNumbers.sort((a, b) => b.score - a.score);
      const selectedNumbers = rankedNumbers.slice(0, targetHousesCount).map(r => r.numStr);

      selectedNumbers.forEach(numStr => {
        lastSeenParchi.set(numStr, p);
        appearanceCount.set(numStr, (appearanceCount.get(numStr) ?? 0) + 1);
      });

      const houseAmounts: number[] = new Array(targetHousesCount).fill(houseStep);
      let remaining = thisParchiTotal - (targetHousesCount * houseStep);

      while (remaining >= houseStep) {
        const rIdx = Math.floor(Math.random() * targetHousesCount);
        const chunkSteps = (smallAmountsInResult || thisParchiTotal <= 1000)
          ? 1
          : Math.min(Math.floor(remaining / houseStep), Math.floor(Math.random() * 2) + 1);
        const addAmount = chunkSteps * houseStep;
        houseAmounts[rIdx] += addAmount;
        remaining -= addAmount;
      }

      if (remaining > 0) {
        const rIdx = Math.floor(Math.random() * targetHousesCount);
        houseAmounts[rIdx] += remaining;
      }

      const houses: ParchiHouse[] = selectedNumbers.map((numStr, hIdx) => ({
        number: numStr,
        amount: houseAmounts[hIdx],
      }));

      for (let i = houses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [houses[i], houses[j]] = [houses[j], houses[i]];
      }

      const finalParchiSum = houses.reduce((s, h) => s + h.amount, 0);

      parchis.push({
        id: p + 1,
        parchiNumber: p + 1,
        houses,
        totalAmount: finalParchiSum,
      });
    }

    return parchis;
  };

  const handleProcessParchi = () => {
    const data = executeGeneration();
    if (!data) return;
    setGeneratedParchis(data);
    setIsJantriModalOpen(false);
    setStatusMessage(`${data.length} parchis generated! Total: ₹${grandTotal.toLocaleString('en-IN')}`);
    setTimeout(() => setStatusMessage(null), 5000);

    setTimeout(() => {
      const el = document.getElementById('parchi-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handler for Process Jantri:
  // Shows the EXACT same parchi results auto-filled into 100-boxes! Active ONLY after Process Parchi!
  const handleProcessJantri = () => {
    if (generatedParchis.length === 0) {
      setStatusMessage('Pehle "Process parchi" par click karein!');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }
    setActiveJantriIndex(0);
    setIsJantriModalOpen(true);
  };

  // Copy single parchi text (with 01, 02... formatting)
  const handleCopySingleParchi = (parchi: ParchiItem) => {
    const text = `Parchi Number: ${parchi.parchiNumber}\n\n${parchi.houses.map(h => `${formatWithLeadingZero(h.number)}-${h.amount}`).join(', ')}\n\nTotal amount: ${parchi.totalAmount}`;
    navigator.clipboard.writeText(text);
    setCopiedParchiId(parchi.id);
    setTimeout(() => setCopiedParchiId(null), 2000);
  };

// Pure HTML5 Canvas 2D Renderer for Jantri (Instant 5ms execution, crisp high resolution, zero CSS/DOM hang bugs)
function renderJantriToCanvas(
  parchi: ParchiItem,
  gridMode: GridMode,
  themeIndex: number,
  formatWithLeadingZero: (val: number | string) => string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // High-resolution 2200x2600 px (Ultra-HD, crystal-clear zoom on WhatsApp & Gallery)
  const width = 2200;
  const height = 2600;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const themes = [
    { header: '#1d4ed8', badge: '#2563eb', emptyBadge: '#dbeafe', emptyBadgeText: '#1e40af', activeBg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a' },
    { header: '#047857', badge: '#059669', emptyBadge: '#d1fae5', emptyBadgeText: '#065f46', activeBg: '#ecfdf5', border: '#6ee7b7', text: '#064e3b' },
    { header: '#be123c', badge: '#e11d48', emptyBadge: '#ffe4e6', emptyBadgeText: '#9f1239', activeBg: '#fff1f2', border: '#fda4af', text: '#881337' },
    { header: '#b45309', badge: '#d97706', emptyBadge: '#fef3c7', emptyBadgeText: '#92400e', activeBg: '#fffbeb', border: '#fcd34d', text: '#78350f' },
    { header: '#6d28d9', badge: '#7c3aed', emptyBadge: '#ede9fe', emptyBadgeText: '#5b21b6', activeBg: '#f5f3ff', border: '#c4b5fd', text: '#4c1d95' },
    { header: '#0f766e', badge: '#0d9488', emptyBadge: '#ccfbf1', emptyBadgeText: '#115e59', activeBg: '#f0fdfa', border: '#5eead4', text: '#134e4a' },
    { header: '#c2410c', badge: '#ea580c', emptyBadge: '#ffedd5', emptyBadgeText: '#9a3412', activeBg: '#fff7ed', border: '#fdba74', text: '#7c2d12' },
    { header: '#a21caf', badge: '#c026d3', emptyBadge: '#fae8ff', emptyBadgeText: '#86198f', activeBg: '#fdf4ff', border: '#f0abfc', text: '#701a75' },
    { header: '#4d7c0f', badge: '#65a30d', emptyBadge: '#ecfccb', emptyBadgeText: '#3f6212', activeBg: '#f7fee7', border: '#bef264', text: '#365314' },
    { header: '#334155', badge: '#475569', emptyBadge: '#e2e8f0', emptyBadgeText: '#1e293b', activeBg: '#f8fafc', border: '#cbd5e1', text: '#0f172a' },
  ];
  const t = themes[themeIndex % themes.length];

  const parchiMap = new Map<string, number>();
  parchi.houses.forEach((h) => {
    parchiMap.set(formatWithLeadingZero(h.number), h.amount);
  });

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const margin = 16;
  const contentWidth = width - margin * 2;

  // Outer border
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 6;
  ctx.strokeRect(margin, margin, contentWidth, height - margin * 2);

  // Header Banner
  const headerHeight = 150;
  ctx.fillStyle = t.header;
  ctx.fillRect(margin, margin, contentWidth, headerHeight);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Jantri #${parchi.parchiNumber}`, margin + 35, margin + 98);

  // Grid Dimensions (10 rows x 11 cols)
  const gridStartX = margin;
  const gridStartY = margin + headerHeight;
  const colHeaderHeight = 84;
  const footerHeight = 120;
  const numCols = 11;
  const cellWidth = contentWidth / numCols;
  const cellHeight = (height - margin * 2 - headerHeight - footerHeight - colHeaderHeight) / 10;

  // Column Headers 1 to 10
  const cols = gridMode === '0-99' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  ctx.fillStyle = t.header;
  ctx.fillRect(gridStartX, gridStartY, contentWidth, colHeaderHeight);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';

  cols.forEach((colNum, c) => {
    const x = gridStartX + c * cellWidth;
    ctx.fillText(String(colNum), x + cellWidth / 2, gridStartY + 56);
    if (c > 0) {
      ctx.beginPath();
      ctx.moveTo(x, gridStartY);
      ctx.lineTo(x, gridStartY + colHeaderHeight);
      ctx.stroke();
    }
  });

  // 11th Column Header: Total
  const totalHeaderX = gridStartX + 10 * cellWidth;
  const totalHeaderW = contentWidth - 10 * cellWidth;
  ctx.fillStyle = '#d97706'; // Amber-600
  ctx.fillRect(totalHeaderX, gridStartY, totalHeaderW, colHeaderHeight);
  ctx.beginPath();
  ctx.moveTo(totalHeaderX, gridStartY);
  ctx.lineTo(totalHeaderX, gridStartY + colHeaderHeight);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Total', totalHeaderX + totalHeaderW / 2, gridStartY + 56);

  // Grid Cells (10 rows x 11 cols: 10 house cells + 1 row total cell)
  const tableStartY = gridStartY + colHeaderHeight;

  for (let r = 0; r < 10; r++) {
    let rowTotal = 0;
    for (let c = 0; c < 10; c++) {
      let label = '';
      if (gridMode === '1-100') {
        const num = r * 10 + (c + 1);
        label = num <= 9 ? `0${num}` : num.toString();
      } else if (gridMode === '00-99') {
        const num = r * 10 + (c + 1);
        label = num === 100 ? '00' : (num < 10 ? `0${num}` : num.toString());
      } else {
        const num = r * 10 + c;
        label = num <= 9 ? `0${num}` : num.toString();
      }

      const cellX = gridStartX + c * cellWidth;
      const cellY = tableStartY + r * cellHeight;
      const cellFormatted = formatWithLeadingZero(label);
      const cellAmount = parchiMap.get(cellFormatted) ?? 0;
      const isFilled = cellAmount > 0;
      if (isFilled) {
        rowTotal += cellAmount;
      }

      // Cell background
      ctx.fillStyle = isFilled ? t.activeBg : '#ffffff';
      ctx.fillRect(cellX, cellY, cellWidth, cellHeight);

      // Cell border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);

      // Box Number Badge (Top-left, large & prominent)
      const badgeW = 72;
      const badgeH = 46;
      ctx.fillStyle = isFilled ? t.badge : t.emptyBadge;
      if ('roundRect' in ctx) {
        ctx.beginPath();
        (ctx as any).roundRect(cellX + 8, cellY + 8, badgeW, badgeH, 8);
        ctx.fill();
      } else {
        ctx.fillRect(cellX + 8, cellY + 8, badgeW, badgeH);
      }

      ctx.fillStyle = isFilled ? '#ffffff' : t.emptyBadgeText;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, cellX + 8 + badgeW / 2, cellY + 8 + 33);

      // Amount (Center/Bottom, BIG & BOLD font to fill the box nicely)
      if (isFilled) {
        ctx.fillStyle = t.text;
        const amtStr = String(cellAmount);
        if (amtStr.length > 5) {
          ctx.font = 'bold 48px sans-serif';
        } else if (amtStr.length > 4) {
          ctx.font = 'bold 54px sans-serif';
        } else {
          ctx.font = 'bold 62px sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.fillText(amtStr, cellX + cellWidth / 2, cellY + cellHeight - 36);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '300 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('-', cellX + cellWidth / 2, cellY + cellHeight - 36);
      }
    }

    // 11th Column: Row Total Cell
    const totalCellX = gridStartX + 10 * cellWidth;
    const totalCellW = contentWidth - 10 * cellWidth;
    const totalCellY = tableStartY + r * cellHeight;

    // Row total background & border
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(totalCellX, totalCellY, totalCellW, cellHeight);

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.strokeRect(totalCellX, totalCellY, totalCellW, cellHeight);

    // Row total amount text (centered, large & bold font, no R1/R2 badge)
    if (rowTotal > 0) {
      ctx.fillStyle = '#451a03';
      const totStr = String(rowTotal);
      if (totStr.length > 5) {
        ctx.font = 'bold 48px monospace';
      } else if (totStr.length > 4) {
        ctx.font = 'bold 54px monospace';
      } else {
        ctx.font = 'bold 62px monospace';
      }
      ctx.textAlign = 'center';
      ctx.fillText(totStr, totalCellX + totalCellW / 2, totalCellY + cellHeight / 2 + 20);
    } else {
      ctx.fillStyle = '#d1d5db';
      ctx.font = '300 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('-', totalCellX + totalCellW / 2, totalCellY + cellHeight / 2 + 16);
    }
  }

  // Footer Banner
  const footerY = height - margin - footerHeight;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(gridStartX, footerY, contentWidth, footerHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(gridStartX, footerY, contentWidth, footerHeight);

  ctx.fillStyle = t.header;
  ctx.font = 'bold 58px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Jantri Total: ₹${parchi.totalAmount.toLocaleString('en-IN')}`, width - 45, footerY + 76);

  return canvas;
}

  // Share Jantri as JPG Image (Native Android Share / Web Share / Download)
  const handleShareJantriAsJpg = async (parchi: ParchiItem) => {
    try {
      setSharingJantriId(parchi.id);
      setStatusMessage(`Preparing Jantri #${parchi.parchiNumber}...`);

      const themeIdx = (parchi.id - 1) >= 0 ? (parchi.id - 1) : 0;
      const canvas = renderJantriToCanvas(parchi, gridMode, themeIdx, formatWithLeadingZero);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const fileName = `Jantri_${parchi.parchiNumber}_Total_${parchi.totalAmount}.jpg`;
      const base64Data = dataUrl.split(',')[1];

      // 1. Android Capacitor Native App
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeJantri.shareImage({
            base64: base64Data,
            fileName: fileName,
          });
          setStatusMessage(`Jantri #${parchi.parchiNumber} ready to share!`);
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        } catch (nativeErr: any) {
          console.warn('NativeJantri share error, trying fallback:', nativeErr);
          // Try standard Capacitor share if native plugin had issue
          try {
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
            });
            const uriRes = await Filesystem.getUri({
              directory: Directory.Cache,
              path: fileName,
            });
            await Share.share({
              title: `Jantri #${parchi.parchiNumber}`,
              files: [uriRes.uri || savedFile.uri],
              dialogTitle: `Share Jantri #${parchi.parchiNumber}`,
            });
            setStatusMessage(`Jantri #${parchi.parchiNumber} shared!`);
            setTimeout(() => setStatusMessage(null), 3000);
            return;
          } catch (fallbackErr: any) {
            console.error('All native share failed:', fallbackErr);
            alert(`Share failed: ${nativeErr?.message || fallbackErr?.message || 'Error'}`);
            setStatusMessage('Share failed.');
            setTimeout(() => setStatusMessage(null), 3500);
            return;
          }
        }
      }

      // 2. Web Share API with File (Supported in mobile browsers)
      if (navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Jantri #${parchi.parchiNumber}`,
            });
            setStatusMessage(`Jantri #${parchi.parchiNumber} shared!`);
            setTimeout(() => setStatusMessage(null), 3000);
            return;
          }
        } catch (webShareErr: any) {
          console.warn('Web Share failed', webShareErr);
          if (webShareErr?.name === 'AbortError') {
            return;
          }
        }
      }

      // 3. Fallback: Direct Download JPG
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setStatusMessage(`Jantri #${parchi.parchiNumber} downloaded!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to share Jantri JPG:', err);
      alert('Error sharing Jantri image: ' + (err?.message || err));
      setStatusMessage('Error sharing Jantri image.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setSharingJantriId(null);
    }
  };

  // Direct Download Jantri as JPG Image
  const handleDownloadJantri = async (parchi: ParchiItem) => {
    try {
      setDownloadingJantriId(parchi.id);
      setStatusMessage(`Saving Jantri #${parchi.parchiNumber}...`);

      const themeIdx = (parchi.id - 1) >= 0 ? (parchi.id - 1) : 0;
      const canvas = renderJantriToCanvas(parchi, gridMode, themeIdx, formatWithLeadingZero);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const fileName = `Jantri_${parchi.parchiNumber}_Total_${parchi.totalAmount}.jpg`;
      const base64Data = dataUrl.split(',')[1];

      // 1. Android Capacitor Native App
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeJantri.downloadImage({
            base64: base64Data,
            fileName: fileName,
          });
          setStatusMessage(`Jantri #${parchi.parchiNumber} saved to Gallery successfully!`);
          setTimeout(() => setStatusMessage(null), 3500);
          return;
        } catch (nativeErr: any) {
          console.warn('NativeJantri download error:', nativeErr);
          try {
            // Fallback: use share so user can save or send
            await NativeJantri.shareImage({
              base64: base64Data,
              fileName: fileName,
            });
            return;
          } catch (e: any) {
            alert('Save failed: ' + (nativeErr?.message || e?.message || 'Error'));
            return;
          }
        }
      }

      // 2. Direct browser download (Web / Desktop)
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setStatusMessage(`Jantri #${parchi.parchiNumber} saved successfully!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to download Jantri JPG:', err);
      alert('Error saving Jantri image: ' + (err?.message || err));
      setStatusMessage('Error saving Jantri image.');
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setDownloadingJantriId(null);
    }
  };

  return (
    <div id="jantri-app-container" className="min-h-screen bg-[#f1f5f9] text-gray-800 flex flex-col font-sans overflow-x-hidden relative">
      {/* Pull Down to Refresh Indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-100 flex items-center gap-2 bg-[#21324a] text-white px-4 py-1.5 rounded-full shadow-2xl border border-amber-400/50 text-xs font-bold pointer-events-none"
          style={{ transform: `translate(-50%, ${pullY * 0.7}px)` }}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${pullY > 55 || isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing app...' : pullY > 55 ? 'Release to refresh' : 'Pull down to refresh'}</span>
        </div>
      )}

      {/* Top App Header */}
      <header id="main-header" className="bg-[#21324a] text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-md flex items-center justify-between sticky top-0 z-30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xs text-slate-900 font-black text-xs select-none">
            A
          </div>
          <h1 className="text-base sm:text-xl font-bold tracking-wide text-amber-400">
            Aman Parchi software
          </h1>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {/* User phone & role */}
            <div className="hidden xs:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-semibold text-slate-200">{currentUser.phoneNumber}</span>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                  ADMIN
                </span>
              )}
            </div>

            {/* Admin Panel button (only for admin) */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title="Admin Control Panel"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* Change Password button */}
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs px-2 sm:px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Change Password"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Password</span>
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => {
                logoutUser();
                setCurrentUser(null);
              }}
              className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 sm:px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area - Full width responsive, strictly no horizontal scroll */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3 overflow-x-hidden">

        {/* Input Section - 'Enter amount to fill jantri:' */}
        <section id="amount-input-section" className="mb-3 sm:mb-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between flex-wrap gap-1">
              <label htmlFor="jantri-amount-input" className="text-xs sm:text-sm font-medium text-gray-700">
                Enter amount to fill jantri:
              </label>
            </div>

            {/* Live Amount Input Field */}
            <div className="relative flex items-center w-full max-w-xs sm:max-w-sm">
              <input
                id="jantri-amount-input"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a] focus:border-[#21324a] shadow-xs"
              />
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1 text-xs font-medium cursor-pointer"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-xs text-gray-500 mr-0.5">Quick:</span>
              {['100', '200', '500', '1000'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPreset(val)}
                  className={`text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                    amount === val
                      ? 'bg-[#21324a] text-white border-[#21324a]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="text-xs px-2 py-0.5 sm:py-1 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* Parchi Fast Text Entry Box Section */}
        <section id="fast-entry-section" className="mb-3 sm:mb-4 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <label htmlFor="fast-entry-textarea" className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <span>Parchi Text Box (Fast Grid Fill):</span>
            </label>
            {customEntryText && (
              <button
                type="button"
                onClick={() => setCustomEntryText('')}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                title="Clear text box"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Text</span>
              </button>
            )}
          </div>

          <textarea
            id="fast-entry-textarea"
            rows={2}
            value={customEntryText}
            onChange={(e) => setCustomEntryText(e.target.value)}
            placeholder="Type or paste: e.g. 01-25, 02-50, 07-90 or 12,50,60,08,07&50"
            className="w-full bg-slate-50/70 border border-gray-300 rounded-lg p-2.5 text-xs sm:text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a] focus:bg-white shadow-xs resize-y"
          />

          <div className="mt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap text-gray-500">
              <span className="text-[11px]">Amount symbols:</span>
              {['=', '%', '#', '&', '*', '-'].map((sym) => (
                <span
                  key={sym}
                  className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-700 text-[11px]"
                  title={`Symbol represents amount: ${sym}`}
                >
                  {sym}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400">Quick Test:</span>
              <button
                type="button"
                onClick={() => setCustomEntryText('01-25, 02-50, 07-90')}
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 cursor-pointer"
              >
                01-25...
              </button>
              <button
                type="button"
                onClick={() => setCustomEntryText('12,50,60,08,07&50')}
                className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 cursor-pointer"
              >
                12,50..&50
              </button>
            </div>
          </div>

          {isCustomMode && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-gray-500 text-[11px]">
                Grid is filled from text box. Clear text to use uniform amount.
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {parsedCustomData.filledCount} Boxes Filled (₹{parsedCustomData.totalSum.toLocaleString('en-IN')})
              </span>
            </div>
          )}
        </section>

        {/* 100 Text Boxes Responsive Grid - Modern Blue Design */}
        <div
          id="jantri-table-container"
          className="w-full bg-white rounded-xl border border-blue-300/80 shadow-md overflow-hidden"
        >
          <div className="w-full grid grid-cols-10 border-collapse">
            {/* Column Headers 1 to 10 with sleek Royal Blue gradient */}
            {columns.map((colNum) => (
              <div
                key={`col-header-${colNum}`}
                className="bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] py-1 sm:py-1.5 font-bold text-white text-[10px] sm:text-xs md:text-sm text-center border-b border-r border-blue-900/40 last:border-r-0 tracking-wide select-none shadow-xs"
              >
                {colNum}
              </div>
            ))}

            {/* 100 Grid Cells (10 rows x 10 columns) */}
            {gridCells.flatMap((rowCells, rowIndex) =>
              rowCells.map((cell) => {
                const cellNum = parseInt(cell.label, 10) === 0 ? 100 : parseInt(cell.label, 10);
                const hasCustomVal = isCustomMode && parsedCustomData.amountsMap[cellNum] !== undefined;
                const cellVal = isCustomMode
                  ? (hasCustomVal ? parsedCustomData.amountsMap[cellNum].toString() : '')
                  : amount;

                return (
                  <div
                    key={`cell-${cell.label}`}
                    className={`border-b border-r border-blue-100/90 last:border-r-0 ${
                      rowIndex === 9 ? 'border-b-0' : ''
                    } ${
                      hasCustomVal ? 'bg-amber-100/80 shadow-inner' : 'bg-white hover:bg-blue-50/70'
                    } transition-colors p-[1.5px] sm:p-1.5 flex flex-col justify-between`}
                  >
                    {/* Top Badge: Modern Blue Pill Badge */}
                    <div className="flex items-center justify-start">
                      <span
                        className={`${
                          hasCustomVal
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        } text-white text-[9px] sm:text-[10px] md:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm select-none leading-none shadow-xs tracking-tight`}
                        title={`Number: ${cell.label}`}
                      >
                        {cell.label}
                      </span>
                    </div>

                    {/* Bottom: High-Contrast Amount Display */}
                    <div className="mt-0.5 sm:mt-1 w-full">
                      <input
                        type="text"
                        readOnly
                        value={cellVal}
                        aria-label={`Box ${cell.label}`}
                        className={`w-full text-center font-extrabold ${
                          hasCustomVal ? 'text-amber-950 font-black' : 'text-blue-950'
                        } text-[11px] sm:text-xs md:text-sm py-0.5 px-0 bg-transparent border-0 outline-none cursor-default select-all truncate tracking-tight`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Grand Total */}
        <section id="grand-total-section" className="mt-3 sm:mt-4 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50 p-3 sm:p-3.5 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm sm:text-base font-bold text-gray-800">
              Grand Total: <span className="font-mono text-base sm:text-lg font-black text-blue-700">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
            {isCustomMode && (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                {parsedCustomData.filledCount} boxes filled
              </div>
            )}
          </div>
        </section>

        {/* Bottom Actions - Parchi Generation Section */}
        <section id="bottom-actions-section" className="space-y-3 mb-6 sm:mb-8 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <label htmlFor="parchi-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
              Enter number of jantri or parchi to generate:
            </label>
            <input
              id="parchi-input"
              type="number"
              min="1"
              max="50"
              placeholder="e.g. 10"
              value={parchiNumber}
              onChange={(e) => setParchiNumber(e.target.value)}
              className="w-full max-w-md bg-white border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#21324a] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="small-amounts-checkbox"
              checked={smallAmountsInResult}
              onChange={(e) => setSmallAmountsInResult(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#21324a] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="small-amounts-checkbox" className="text-xs sm:text-sm text-gray-700 select-none cursor-pointer">
              Small amounts
            </label>
          </div>

          {statusMessage && (
            <div
              id="status-message-banner"
              className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs sm:text-sm flex items-center justify-between shadow-xs max-w-md"
            >
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="max-w-md pt-1 space-y-2.5">
            {/* Process Parchi Button */}
            <button
              id="process-parchi-button"
              type="button"
              className="w-full bg-[#21324a] hover:bg-[#2c4261] text-white font-semibold py-2.5 px-4 rounded-lg shadow-xs transition-all active:scale-[0.99] cursor-pointer text-center text-sm flex items-center justify-center gap-1.5"
              onClick={handleProcessParchi}
            >
              <RefreshCw className="w-4 h-4" />
              Process parchi (Generate {parchiNumber || '0'} Parchis)
            </button>

            {/* Process Jantri Button - Active ONLY after Process Parchi is clicked */}
            <button
              id="process-jantri-button"
              type="button"
              disabled={generatedParchis.length === 0}
              className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-all text-center text-sm flex items-center justify-center gap-1.5 ${
                generatedParchis.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs active:scale-[0.99] cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed opacity-70'
              }`}
              onClick={handleProcessJantri}
              title={
                generatedParchis.length > 0
                  ? `Open filled 100-boxes Jantri (${generatedParchis.length} Jantries)`
                  : 'Pehle "Process parchi" par click karein'
              }
            >
              <Layers className="w-4 h-4" />
              <span>
                {generatedParchis.length > 0
                  ? `Process jantri (View ${generatedParchis.length} Jantries)`
                  : `Process jantri (Generate ${parchiNumber || '0'} Jantries)`}
              </span>
            </button>
          </div>
        </section>

        {/* Generated Parchis Display Section - Formatted like user screenshot */}
        {/* Generated Parchis Display Section - Only Classic Parchi Text List */}
        {generatedParchis.length > 0 && (
          <section id="parchi-results-section" className="mt-6 mb-12 bg-white rounded-xl border border-gray-300 shadow-sm p-3.5 sm:p-6">
            {/* Results Section Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 flex-wrap gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#21324a] flex items-center gap-2">
                  <span>Generated Parchis ({generatedParchis.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Total Sum: <strong className="text-emerald-700 font-bold">₹{generatedParchis.reduce((s, p) => s + p.totalAmount, 0).toLocaleString('en-IN')}</strong> / ₹{grandTotal.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Only Clear Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratedParchis([])}
                  className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer font-medium"
                  title="Clear results"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Content: ONLY Classic Parchi Text List */}
            <div className="space-y-8">
              {generatedParchis.map((parchi) => (
                <div
                  key={parchi.id}
                  id={`parchi-card-${parchi.parchiNumber}`}
                  className="pb-6 border-b border-gray-200 last:border-b-0 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#21324a]">
                      Parchi Number: {parchi.parchiNumber}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                        {parchi.houses.length} Houses
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingleParchi(parchi)}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Copy this parchi"
                      >
                        {copiedParchiId === parchi.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-800 text-sm sm:text-base font-normal tracking-wide leading-relaxed py-1">
                    {parchi.houses.map((house, idx) => (
                      <span key={`${parchi.id}-house-${idx}`} className="inline-block mr-2.5 mb-1.5">
                        <span className="font-semibold text-gray-900">{formatWithLeadingZero(house.number)}</span>
                        <span className="text-gray-500">-</span>
                        <span className="font-medium text-gray-800">{house.amount}</span>
                        {idx < parchi.houses.length - 1 && <span className="text-gray-400">,</span>}
                      </span>
                    ))}
                  </div>

                  <div className="pt-1">
                    <div className="text-2xl sm:text-3xl font-semibold text-[#21324a]">
                      Total amount: {parchi.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Results Aggregate Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-3.5 rounded-lg">
              <div className="text-sm font-bold text-gray-700">
                All Results Total:{' '}
                <span className="text-base sm:text-lg text-emerald-700 font-mono font-extrabold">
                  ₹{generatedParchis.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Strictly equal to Grand Total ₹{grandTotal.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleProcessJantri}
                  className="text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open in Jantri Window</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Dedicated Full-Screen Window Modal for 100-Boxes Jantris */}
        {isJantriModalOpen && generatedParchis.length > 0 && (
          <div
            id="jantri-window-modal"
            className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex flex-col p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
          >
            <div className="w-full max-w-5xl mx-auto flex-1 bg-[#f8fafc] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
              {/* Modal Top Header */}
              <div className="bg-[#21324a] text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsJantriModalOpen(false)}
                    className="p-1 -ml-1 text-amber-400 hover:text-white transition-colors cursor-pointer rounded-lg flex items-center"
                    title="Back"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xs text-slate-900 font-black text-xs select-none">
                    A
                  </div>
                  <h2 className="text-base sm:text-xl font-bold tracking-wide text-amber-400">
                    Aman Parchi software
                  </h2>
                </div>
              </div>

              {/* Modal Body: Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
                {/* Tabs Mode inside Modal */}
                {jantriViewMode === 'tabs' ? (
                  <div className="space-y-4">
                    {/* Horizontal Tabs Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {generatedParchis.map((parchi, idx) => {
                        const theme = JANTRI_THEMES[idx % JANTRI_THEMES.length];
                        const isActive = activeJantriIndex === idx;
                        return (
                          <button
                            key={`modal-tab-${parchi.id}`}
                            type="button"
                            onClick={() => setActiveJantriIndex(idx)}
                            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isActive ? theme.tabActive : theme.tabInactive
                            }`}
                          >
                            <span>Jantri #{parchi.parchiNumber}</span>
                            <span className="text-[10px] font-mono opacity-85">
                              (₹{parchi.totalAmount})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between text-xs text-gray-600 px-1 select-none">
                      <button
                        type="button"
                        disabled={activeJantriIndex === 0}
                        onClick={() => setActiveJantriIndex((prev) => Math.max(0, prev - 1))}
                        className="w-28 shrink-0 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer font-semibold shadow-2xs transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Prev Jantri</span>
                      </button>
                      <div className="flex-1 flex items-center justify-center text-center px-2">
                        <span className="font-bold text-gray-800 text-sm sm:text-base tabular-nums select-none tracking-normal">
                          Jantri #{activeJantriIndex + 1} of {generatedParchis.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={activeJantriIndex === generatedParchis.length - 1}
                        onClick={() => setActiveJantriIndex((prev) => Math.min(generatedParchis.length - 1, prev + 1))}
                        className="w-28 shrink-0 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer font-semibold shadow-2xs transition-colors"
                      >
                        <span>Next Jantri</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Render Selected Jantri Grid */}
                    {generatedParchis[activeJantriIndex] && (
                      <SingleJantriBoxGrid
                        parchi={generatedParchis[activeJantriIndex]}
                        themeIndex={activeJantriIndex}
                        columns={columns}
                        gridCells={gridCells}
                        formatWithLeadingZero={formatWithLeadingZero}
                        onShare={() => handleShareJantriAsJpg(generatedParchis[activeJantriIndex])}
                        isSharing={sharingJantriId === generatedParchis[activeJantriIndex].id}
                        onDownload={() => handleDownloadJantri(generatedParchis[activeJantriIndex])}
                        isDownloading={downloadingJantriId === generatedParchis[activeJantriIndex].id}
                      />
                    )}
                  </div>
                ) : (
                  /* All Mode inside Modal */
                  <div className="space-y-6">
                    {generatedParchis.map((parchi, idx) => (
                      <SingleJantriBoxGrid
                        key={`modal-all-${parchi.id}`}
                        parchi={parchi}
                        themeIndex={idx}
                        columns={columns}
                        gridCells={gridCells}
                        formatWithLeadingZero={formatWithLeadingZero}
                        onShare={() => handleShareJantriAsJpg(parchi)}
                        isSharing={sharingJantriId === parchi.id}
                        onDownload={() => handleDownloadJantri(parchi)}
                        isDownloading={downloadingJantriId === parchi.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Screen Modal if not authenticated */}
      {!currentUser && (
        <LoginModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setForceLogoutNotice(null);
            if (user.role === 'admin') {
              setShowAdminPanel(true);
            }
          }}
        />
      )}

      {/* Force Logout Notice Modal */}
      {forceLogoutNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 text-center space-y-4 border border-red-200 animate-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Session Expired</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{forceLogoutNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setForceLogoutNotice(null)}
              className="w-full bg-[#21324a] hover:bg-[#2c4263] text-amber-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
            >
              Log In Again
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && currentUser && (
        <ChangePasswordModal
          user={currentUser}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            // Password changed
          }}
        />
      )}

      {/* Admin Control Panel Modal */}
      {showAdminPanel && currentUser?.role === 'admin' && (
        <AdminPanelModal onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
}
