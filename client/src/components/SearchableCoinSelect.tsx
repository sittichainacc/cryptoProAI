import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TickerData } from '../types/index.js';
import { Search, ChevronDown, Check, X, TrendingUp, TrendingDown, Sparkles, Filter } from 'lucide-react';
import { getCurrencyMultiplier } from '../utils/currency.js';

interface SearchableCoinSelectProps {
  coins: TickerData[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  currency: 'THB' | 'USDT';
  placeholder?: string;
  width?: string;
}

export const SearchableCoinSelect: React.FC<SearchableCoinSelectProps> = ({
  coins,
  selectedSymbol,
  onSelectCoin,
  currency,
  placeholder = 'ค้นหาและเลือกเหรียญ...',
  width = '300px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [alignRight, setAlignRight] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const multiplier = getCurrencyMultiplier(currency);
  const prefix = currency === 'THB' ? '฿' : '$';

  // Find currently selected coin
  const currentCoin = useMemo(() => {
    return coins.find((c) => c.symbol.toUpperCase() === selectedSymbol.toUpperCase()) || {
      symbol: selectedSymbol,
      name: selectedSymbol,
      price: 0,
      change24h: 0,
      sector: 'core' as any,
    };
  }, [coins, selectedSymbol]);

  // Sector list from available coins
  const availableSectors = useMemo(() => {
    const s = new Set<string>();
    coins.forEach((c) => {
      if (c.sector) s.add(c.sector);
    });
    return Array.from(s);
  }, [coins]);

  // Filtered coins based on search and sector
  const filteredCoins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return coins.filter((coin) => {
      const matchSector = selectedSector === 'all' || coin.sector === selectedSector;
      if (!matchSector) return false;

      if (!q) return true;
      return (
        coin.symbol.toLowerCase().includes(q) ||
        coin.name.toLowerCase().includes(q) ||
        (coin.sector && coin.sector.toLowerCase().includes(q))
      );
    });
  }, [coins, searchQuery, selectedSector]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus input & compute viewport alignment when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // If container right edge is close to left side of screen (<400px), align left
        if (rect.right < 400) {
          setAlignRight(false);
        } else {
          setAlignRight(true);
        }
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Reset highlight index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, selectedSector]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredCoins.length - 1));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCoins[highlightedIndex]) {
        handleSelect(filteredCoins[highlightedIndex].symbol);
      } else if (searchQuery.trim()) {
        // Direct search fallback
        handleSelect(searchQuery.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.coin-select-item');
      if (items[index]) {
        (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleSelect = (sym: string) => {
    onSelectCoin(sym.toUpperCase());
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatPrice = (p: number) => {
    if (!p) return '-';
    return `${prefix}${(p * multiplier).toLocaleString(undefined, {
      minimumFractionDigits: p < 1 ? 4 : 2,
      maximumFractionDigits: p < 1 ? 4 : 2,
    })}`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width, userSelect: 'none' }} onKeyDown={handleKeyDown}>
      {/* Trigger Button (Combobox Select Header) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1222',
          border: isOpen ? '1.5px solid var(--neon-blue)' : '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#F8FAFC',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 14px rgba(59, 130, 246, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.15s ease',
        }}
        title="คลิกเพื่อค้นหาและเลือกเหรียญทั้งหมด (355+ เหรียญ)"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Search size={14} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
          {/* Symbol Avatar */}
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284C7, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '11px',
              color: '#FFF',
              flexShrink: 0,
            }}
          >
            {currentCoin.symbol.slice(0, 2)}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#FFF' }}>{currentCoin.symbol}</span>
              {currentCoin.price > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--neon-cyan)', fontFamily: 'monospace' }}>
                  {formatPrice(currentCoin.price)}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px' }}>
              {currentCoin.name || currentCoin.symbol}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {currentCoin.change24h !== undefined && currentCoin.change24h !== 0 && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: currentCoin.change24h >= 0 ? '#10B981' : '#EF4444',
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: currentCoin.change24h >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              }}
            >
              {currentCoin.change24h >= 0 ? `+${currentCoin.change24h.toFixed(1)}%` : `${currentCoin.change24h.toFixed(1)}%`}
            </span>
          )}
          <ChevronDown
            size={16}
            color="var(--neon-blue-light)"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...(alignRight ? { right: 0 } : { left: 0 }),
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: '#0F172A',
            border: '1.5px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '12px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85), 0 0 25px rgba(59, 130, 246, 0.25)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Box Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0B1222' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              <Search size={15} color="var(--neon-cyan)" />
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Sector Filters */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginTop: '8px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollbarWidth: 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedSector('all')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: selectedSector === 'all' ? '1px solid var(--neon-blue)' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: selectedSector === 'all' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedSector === 'all' ? '#FFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ทั้งหมด ({coins.length})
              </button>
              {availableSectors.map((sector) => {
                const isAct = selectedSector === sector;
                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setSelectedSector(sector)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: isAct ? '1px solid var(--neon-blue)' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isAct ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: isAct ? '#FFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Result Statistics */}
          <div
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <span>
              พบ <strong>{filteredCoins.length}</strong> เหรียญ
            </span>
            <span>กด ↑ ↓ เพื่อเลื่อน, Enter เพื่อเลือก</span>
          </div>

          {/* Coin List */}
          <div
            ref={listRef}
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '4px 6px',
            }}
          >
            {filteredCoins.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  ไม่พบเหรียญที่ตรงกับ "{searchQuery}"
                </div>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery.trim().toUpperCase())}
                    style={{
                      marginTop: '10px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid var(--neon-blue)',
                      color: 'var(--neon-blue-light)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ วิเคราะห์ "{searchQuery.trim().toUpperCase()}" ทันที
                  </button>
                )}
              </div>
            ) : (
              filteredCoins.map((coin, index) => {
                const isSelected = coin.symbol.toUpperCase() === selectedSymbol.toUpperCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={coin.symbol}
                    className="coin-select-item"
                    onClick={() => handleSelect(coin.symbol)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isHighlighted
                        ? 'rgba(59, 130, 246, 0.18)'
                        : isSelected
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'transparent',
                      border: isHighlighted
                        ? '1px solid rgba(59, 130, 246, 0.35)'
                        : isSelected
                        ? '1px solid rgba(16, 185, 129, 0.25)'
                        : '1px solid transparent',
                      marginBottom: '2px',
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isSelected ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        {isSelected ? <Check size={14} /> : coin.symbol.slice(0, 2)}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#FFF' }}>{coin.symbol}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {coin.sector || 'crypto'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{coin.name}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFF', fontFamily: 'monospace' }}>
                        {formatPrice(coin.price)}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: coin.change24h >= 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {coin.change24h >= 0 ? `+${coin.change24h.toFixed(2)}%` : `${coin.change24h.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
