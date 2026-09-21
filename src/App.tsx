import React, { useState, useMemo } from 'react';
import { GridMode, ParchiItem, ParchiHouse } from './types';
import { RotateCcw, SlidersHorizontal, Copy, Check, Trash2, RefreshCw } from 'lucide-react';

export default function App() {
  // Amount input for filling Jantri (e.g. 500)
  const [amount, setAmount] = useState<string>('500');
  const [gridMode, setGridMode] = useState<GridMode>('1-100');
  const [parchiNumber, setParchiNumber] = useState<string>('10');
  const [smallAmountsInResult, setSmallAmountsInResult] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedParchis, setGeneratedParchis] = useState<ParchiItem[]>([]);
  const [copiedParchiId, setCopiedParchiId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

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

  // Grand Total calculation: exactly 100 boxes * amount (e.g. 500 * 100 = 50,000)
  const numericAmount = parseFloat(amount) || 0;
  const grandTotal = numericAmount * 100;

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
  const handleProcessParchi = () => {
    const count = parseInt(parchiNumber, 10);
    if (isNaN(count) || count <= 0) {
      setStatusMessage('Please enter a valid number of parchis (e.g. 10)');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    if (grandTotal <= 0) {
      setStatusMessage('Please enter a valid amount above (e.g. 500)');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    // Step 1: Calculate balanced parchi totals with strictly subtle variance (±5 to ±10)
    // and completely randomized distribution across all parchis (no grouping at top or bottom).
    const parchiStep = (grandTotal % 5 === 0) ? 5 : 1;
    const exactAverage = grandTotal / count;

    // Base value rounded down to parchiStep
    const baseVal = Math.floor(exactAverage / parchiStep) * parchiStep;
    const parchiTotals: number[] = new Array(count).fill(baseVal);

    // Initial remainder to distribute to reach grandTotal exactly
    let remainder = grandTotal - (baseVal * count);

    // Randomly distribute the initial remainder in steps of parchiStep across randomly shuffled parchi indices
    // This ensures no bias towards top or bottom indices!
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

    // Introduce subtle randomized variance between pairs so it's not all identical numbers,
    // but strictly keep the difference within ±5 to ±10 of the average (maxDeviation = 10)!
    const maxDeviation = 10;
    const numSwaps = Math.floor(count * 1.5);
    for (let s = 0; s < numSwaps; s++) {
      const i = Math.floor(Math.random() * count);
      const j = Math.floor(Math.random() * count);
      if (i === j) continue;

      const newTotalI = parchiTotals[i] + parchiStep;
      const newTotalJ = parchiTotals[j] - parchiStep;

      // Strictly ensure both remain within maxDeviation (±5 to ±10) from exactAverage
      if (
        Math.abs(newTotalI - exactAverage) <= maxDeviation &&
        Math.abs(newTotalJ - exactAverage) <= maxDeviation &&
        newTotalJ > 0
      ) {
        parchiTotals[i] = newTotalI;
        parchiTotals[j] = newTotalJ;
      }
    }

    // Shuffle the entire parchiTotals array so high, medium, and low totals are completely interspersed throughout!
    for (let i = parchiTotals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parchiTotals[i], parchiTotals[j]] = [parchiTotals[j], parchiTotals[i]];
    }

    // Step 2: Strictly 100 available numbers formatted with leading zeros for 0-9 (01 to 100, 01 to 00, 00 to 99). Never > 100!
    const availableNumbers: string[] = [];
    for (let i = 1; i <= 100; i++) {
      if (gridMode === '00-99') {
        availableNumbers.push(i === 100 ? '00' : (i < 10 ? `0${i}` : i.toString()));
      } else if (gridMode === '0-99') {
        const val = i - 1;
        availableNumbers.push(val < 10 ? `0${val}` : val.toString());
      } else {
        // 1 to 100 -> 01, 02, 03 ... 09, 10 ... 100
        availableNumbers.push(i < 10 ? `0${i}` : i.toString());
      }
    }

    const parchis: ParchiItem[] = [];

    // Fair Rotation & Anti-Starvation Tracking:
    // Tracks when each number was last included and how many times it has appeared in total.
    // Rule: Numbers not chosen in the previous parchi get high priority; numbers absent for 2+ parchis
    // MUST be included in the 3rd parchi. Numbers that just appeared rest so everyone gets fair turns.
    const lastSeenParchi = new Map<string, number>();
    const appearanceCount = new Map<string, number>();
    availableNumbers.forEach(num => {
      lastSeenParchi.set(num, -1);
      appearanceCount.set(num, 0);
    });

    // Step 3: For each parchi, pick houses with fair rotation across availableNumbers
    for (let p = 0; p < count; p++) {
      const thisParchiTotal = parchiTotals[p];

      // House count per parchi as requested:
      // When small checkbox is checked -> 80 to 92 houses
      // When unchecked -> At least 60 houses (60 to 68)
      let targetHousesCount = smallAmountsInResult
        ? Math.floor(Math.random() * 13) + 80 // 80 to 92 houses
        : Math.floor(Math.random() * 9) + 60; // 60 to 68 houses

      // Dynamically calculate houseStep so all target houses can be funded
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

      // Max houses that can be funded with at least 1 houseStep per house
      const maxPossibleHouses = Math.min(100, Math.floor(thisParchiTotal / houseStep));
      if (targetHousesCount > maxPossibleHouses) {
        targetHousesCount = Math.max(1, maxPossibleHouses);
      }

      // Fair Rotation Scoring:
      // 1. Numbers that rested (gap >= 2): Top priority, guaranteed selection!
      // 2. Numbers with lower overall appearanceCount: Prioritized to keep all numbers equal
      // 3. Numbers that appeared in previous parchi (gap === 1): Eligible, but ranked by lowest total appearances
      const scoreNumber = (numStr: string) => {
        const last = lastSeenParchi.get(numStr) ?? -1;
        const totalSeen = appearanceCount.get(numStr) ?? 0;
        const gap = last === -1 ? 999 : p - last;

        let score = 0;
        if (last === -1) {
          // Never appeared yet -> absolute top priority
          score = 100000;
        } else if (gap >= 3) {
          // Absent for 2+ parchis -> high priority turn
          score = 50000 + gap * 1000 - totalSeen * 50;
        } else if (gap === 2) {
          // Rested in the previous parchi -> must get their turn now!
          score = 20000 - totalSeen * 50;
        } else {
          // Appeared in immediate previous parchi (gap === 1):
          // Lower priority; numbers that appeared more often will rest to make room for others
          score = 5000 - totalSeen * 80;
        }

        // Subtle random jitter for natural variations
        score += Math.random() * 15;
        return score;
      };

      const rankedNumbers = [...availableNumbers].map(numStr => ({
        numStr,
        score: scoreNumber(numStr),
      }));

      rankedNumbers.sort((a, b) => b.score - a.score);

      // Select top targetHousesCount numbers based on fair priority
      const selectedNumbers = rankedNumbers.slice(0, targetHousesCount).map(r => r.numStr);

      // Update fair tracking state
      selectedNumbers.forEach(numStr => {
        lastSeenParchi.set(numStr, p);
        appearanceCount.set(numStr, (appearanceCount.get(numStr) ?? 0) + 1);
      });

      // Distribute thisParchiTotal across targetHousesCount in multiples of houseStep
      const houseAmounts: number[] = new Array(targetHousesCount).fill(houseStep);
      let remaining = thisParchiTotal - (targetHousesCount * houseStep);

      // Distribute remaining amount across houses
      while (remaining >= houseStep) {
        const rIdx = Math.floor(Math.random() * targetHousesCount);
        const chunkSteps = (smallAmountsInResult || thisParchiTotal <= 1000)
          ? 1
          : Math.min(Math.floor(remaining / houseStep), Math.floor(Math.random() * 2) + 1);
        const addAmount = chunkSteps * houseStep;
        houseAmounts[rIdx] += addAmount;
        remaining -= addAmount;
      }

      // If any remainder exists, add to random house
      if (remaining > 0) {
        const rIdx = Math.floor(Math.random() * targetHousesCount);
        houseAmounts[rIdx] += remaining;
      }

      const houses: ParchiHouse[] = selectedNumbers.map((numStr, hIdx) => ({
        number: numStr,
        amount: houseAmounts[hIdx],
      }));

      // Randomly shuffle houses so there is no ascending order (shuffled format)
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

    setGeneratedParchis(parchis);
    setStatusMessage(`${count} parchis generated! Total: ₹${grandTotal.toLocaleString('en-IN')}`);
    setTimeout(() => setStatusMessage(null), 5000);

    // Scroll smoothly to parchis container
    setTimeout(() => {
      const el = document.getElementById('parchi-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Copy single parchi text (with 01, 02... formatting)
  const handleCopySingleParchi = (parchi: ParchiItem) => {
    const text = `Parchi Number: ${parchi.parchiNumber}\n\n${parchi.houses.map(h => `${formatWithLeadingZero(h.number)}-${h.amount}`).join(', ')}\n\nTotal amount: ${parchi.totalAmount}`;
    navigator.clipboard.writeText(text);
    setCopiedParchiId(parchi.id);
    setTimeout(() => setCopiedParchiId(null), 2000);
  };

  // Copy all parchis (with 01, 02... formatting)
  const handleCopyAll = () => {
    const allText = generatedParchis.map(p => 
      `Parchi Number: ${p.parchiNumber}\n\n${p.houses.map(h => `${formatWithLeadingZero(h.number)}-${h.amount}`).join(', ')}\n\nTotal amount: ${p.totalAmount}\n`
    ).join('\n------------------------\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div id="jantri-app-container" className="min-h-screen bg-[#f1f5f9] text-gray-800 flex flex-col font-sans overflow-x-hidden">
      {/* Top App Header */}
      <header id="main-header" className="bg-[#21324a] text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-md flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-base sm:text-xl font-bold tracking-wide text-amber-400">
          Aman Parchi software
        </h1>

        <div className="flex items-center gap-2 text-xs">
          <button
            id="settings-toggle-button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 bg-[#2e4465] hover:bg-[#3b557c] px-2.5 py-1.5 rounded text-white transition-colors cursor-pointer text-xs"
            title="Grid Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Full width responsive, strictly no horizontal scroll */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3 overflow-x-hidden">
        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <div id="settings-panel" className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm text-xs sm:text-sm">
            <div className="font-semibold text-gray-700 mb-2">Grid Options:</div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Numbering Format:</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setGridMode('1-100')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border ${
                    gridMode === '1-100' ? 'bg-[#21324a] text-white border-[#21324a]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  1 to 100
                </button>
                <button
                  onClick={() => setGridMode('00-99')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border ${
                    gridMode === '00-99' ? 'bg-[#21324a] text-white border-[#21324a]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  01 to 00
                </button>
                <button
                  onClick={() => setGridMode('0-99')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border ${
                    gridMode === '0-99' ? 'bg-[#21324a] text-white border-[#21324a]' : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  0 to 99
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Live Status Indicator */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-600 mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            <span className="truncate text-blue-900 font-medium">Live Amount: <strong className="text-blue-950 font-bold">₹{amount || '0'}</strong> / box</span>
          </div>
          <span className="text-blue-600 font-semibold font-mono text-[10px] sm:text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 shrink-0">100 Boxes (10×10)</span>
        </div>

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
              rowCells.map((cell) => (
                <div
                  key={`cell-${cell.label}`}
                  className={`border-b border-r border-blue-100/90 last:border-r-0 ${
                    rowIndex === 9 ? 'border-b-0' : ''
                  } bg-white hover:bg-blue-50/70 transition-colors p-[1.5px] sm:p-1.5 flex flex-col justify-between`}
                >
                  {/* Top Badge: Modern Blue Pill Badge */}
                  <div className="flex items-center justify-start">
                    <span
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] sm:text-[10px] md:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm select-none leading-none shadow-xs tracking-tight"
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
                      value={amount}
                      aria-label={`Box ${cell.label}`}
                      className="w-full text-center font-extrabold text-blue-950 text-[11px] sm:text-xs md:text-sm py-0.5 px-0 bg-transparent border-0 outline-none cursor-default select-all truncate tracking-tight"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grand Total - Exactly 100 boxes */}
        <section id="grand-total-section" className="mt-3 sm:mt-4 mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/50 p-3 sm:p-3.5 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm sm:text-base font-bold text-gray-800">
              Grand Total: <span className="font-mono text-base sm:text-lg font-black text-blue-700">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-blue-600/80 font-medium bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs">
              100 boxes × {amount || '0'} = ₹{grandTotal.toLocaleString('en-IN')}
            </div>
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

          <div className="max-w-md pt-1">
            <button
              id="process-parchi-button"
              type="button"
              className="w-full bg-[#21324a] hover:bg-[#2c4261] text-white font-semibold py-2.5 px-4 rounded-lg shadow-xs transition-all active:scale-[0.99] cursor-pointer text-center text-sm flex items-center justify-center gap-1.5"
              onClick={handleProcessParchi}
            >
              <RefreshCw className="w-4 h-4" />
              Process parchi (Generate {parchiNumber || '0'} Parchis)
            </button>
          </div>
        </section>

        {/* Generated Parchis Display Section - Formatted like user screenshot */}
        {generatedParchis.length > 0 && (
          <section id="parchi-results-section" className="mt-6 mb-12 bg-white rounded-xl border border-gray-300 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#21324a]">Generated Parchis ({generatedParchis.length})</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Total Sum: <strong className="text-gray-900">₹{generatedParchis.reduce((s, p) => s + p.totalAmount, 0).toLocaleString('en-IN')}</strong> / ₹{grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs px-3 py-1.5 rounded-md border border-gray-300 transition-colors cursor-pointer font-medium"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedParchis([])}
                  className="flex items-center gap-1 text-red-600 hover:bg-red-50 text-xs px-2.5 py-1.5 rounded-md border border-red-200 transition-colors cursor-pointer"
                  title="Clear"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* List of Parchis matching user screenshot */}
            <div className="space-y-8">
              {generatedParchis.map((parchi) => (
                <div
                  key={parchi.id}
                  id={`parchi-card-${parchi.parchiNumber}`}
                  className="pb-6 border-b border-gray-200 last:border-b-0 space-y-3"
                >
                  {/* Parchi Header */}
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

                  {/* Houses list formatted as: 01-50, 02-100, 03-50, 04-50... */}
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

                  {/* Total Amount matching user screenshot */}
                  <div className="pt-1">
                    <div className="text-2xl sm:text-3xl font-semibold text-[#21324a]">
                      Total amount: {parchi.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Parchis Aggregate Footer */}
            <div className="mt-6 pt-4 border-t border-gray-300 flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-3.5 rounded-lg">
              <div className="text-sm font-bold text-gray-700">
                All Parchis Total:{' '}
                <span className="text-base sm:text-lg text-emerald-700 font-mono font-extrabold">
                  ₹{generatedParchis.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Exactly equal to Grand Total ₹{grandTotal.toLocaleString('en-IN')})
                </span>
              </div>
              <button
                type="button"
                onClick={handleProcessParchi}
                className="text-xs bg-[#21324a] hover:bg-[#2c4261] text-white px-3 py-1.5 rounded-md font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
