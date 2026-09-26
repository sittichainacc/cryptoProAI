import React, { useState } from 'react';

// Brand color & gradient map for top & popular cryptocurrencies
interface CoinBrand {
  primary: string;
  gradient: string;
  glyph?: string; // Optional single character or symbol
}

const COIN_BRANDS: Record<string, CoinBrand> = {
  BTC: { primary: '#F7931A', gradient: 'linear-gradient(135deg, #F7931A, #E27600)', glyph: '₿' },
  ETH: { primary: '#627EEA', gradient: 'linear-gradient(135deg, #627EEA, #4559B5)', glyph: 'Ξ' },
  SOL: { primary: '#14F195', gradient: 'linear-gradient(135deg, #9945FF, #14F195)', glyph: 'S' },
  BNB: { primary: '#F3BA2F', gradient: 'linear-gradient(135deg, #F3BA2F, #D29D12)', glyph: 'B' },
  XRP: { primary: '#23292F', gradient: 'linear-gradient(135deg, #008CE7, #005691)', glyph: '✕' },
  ADA: { primary: '#0033AD', gradient: 'linear-gradient(135deg, #0033AD, #001B6B)', glyph: '₳' },
  DOGE: { primary: '#C2A633', gradient: 'linear-gradient(135deg, #C2A633, #A58B24)', glyph: 'Ð' },
  AVAX: { primary: '#E84142', gradient: 'linear-gradient(135deg, #E84142, #BA2627)', glyph: '▲' },
  DOT: { primary: '#E6007A', gradient: 'linear-gradient(135deg, #E6007A, #A60058)', glyph: '●' },
  SUI: { primary: '#2A82E4', gradient: 'linear-gradient(135deg, #2A82E4, #1B589C)', glyph: '💧' },
  SEI: { primary: '#9B1D20', gradient: 'linear-gradient(135deg, #9B1D20, #611012)', glyph: 'S' },
  ARB: { primary: '#28A0F0', gradient: 'linear-gradient(135deg, #28A0F0, #1377B8)', glyph: 'A' },
  AAVE: { primary: '#B6509E', gradient: 'linear-gradient(135deg, #B6509E, #2EBAC6)', glyph: '👻' },
  JUP: { primary: '#19A7A6', gradient: 'linear-gradient(135deg, #19A7A6, #E0623A)', glyph: '♃' },
  CAKE: { primary: '#D1884F', gradient: 'linear-gradient(135deg, #D1884F, #8F5324)', glyph: '🥞' },
  UNI: { primary: '#FF007A', gradient: 'linear-gradient(135deg, #FF007A, #B80058)', glyph: '🦄' },
  CRV: { primary: '#4064E3', gradient: 'linear-gradient(135deg, #4064E3, #233FA3)', glyph: 'C' },
  RENDER: { primary: '#E51D24', gradient: 'linear-gradient(135deg, #E51D24, #9E0D12)', glyph: 'R' },
  FET: { primary: '#1E3A8A', gradient: 'linear-gradient(135deg, #1E3A8A, #0E204E)', glyph: 'F' },
  TAO: { primary: '#383838', gradient: 'linear-gradient(135deg, #4A4A4A, #1F1F1F)', glyph: 'τ' },
  GRT: { primary: '#6742F1', gradient: 'linear-gradient(135deg, #6742F1, #482BB3)', glyph: 'G' },
  LINK: { primary: '#375BD2', gradient: 'linear-gradient(135deg, #375BD2, #213C9E)', glyph: '⬡' },
  PEPE: { primary: '#43A047', gradient: 'linear-gradient(135deg, #43A047, #2E7D32)', glyph: '🐸' },
  SHIB: { primary: '#FFA409', gradient: 'linear-gradient(135deg, #FFA409, #D48000)', glyph: '🐕' },
  BONK: { primary: '#F89D28', gradient: 'linear-gradient(135deg, #F89D28, #BA6E10)', glyph: '🦴' },
  FLOKI: { primary: '#E28E34', gradient: 'linear-gradient(135deg, #E28E34, #9E5E1C)', glyph: '⚔️' },
  NEAR: { primary: '#00EC97', gradient: 'linear-gradient(135deg, #111111, #00EC97)', glyph: 'N' },
  TON: { primary: '#0098EA', gradient: 'linear-gradient(135deg, #0098EA, #006FB0)', glyph: '💎' },
  APT: { primary: '#222222', gradient: 'linear-gradient(135deg, #333333, #000000)', glyph: '▲' },
  WLD: { primary: '#111111', gradient: 'linear-gradient(135deg, #222222, #000000)', glyph: '🌐' },
  KUB: { primary: '#00E599', gradient: 'linear-gradient(135deg, #00E599, #00A66D)', glyph: 'K' },
  SIX: { primary: '#0066FF', gradient: 'linear-gradient(135deg, #0066FF, #0044B3)', glyph: '6' },
  JFIN: { primary: '#00C853', gradient: 'linear-gradient(135deg, #00C853, #008738)', glyph: 'J' },
  MATIC: { primary: '#8247E5', gradient: 'linear-gradient(135deg, #8247E5, #5A29B0)', glyph: 'M' },
  POL: { primary: '#8247E5', gradient: 'linear-gradient(135deg, #8247E5, #5A29B0)', glyph: 'P' },
  LTC: { primary: '#345D9D', gradient: 'linear-gradient(135deg, #345D9D, #1E3761)', glyph: 'Ł' },
  BCH: { primary: '#8DC351', gradient: 'linear-gradient(135deg, #8DC351, #5C872E)', glyph: '₿' },
  XLM: { primary: '#08B5E5', gradient: 'linear-gradient(135deg, #08B5E5, #047A9E)', glyph: '*' },
  ATOM: { primary: '#2E3148', gradient: 'linear-gradient(135deg, #2E3148, #181928)', glyph: '⚛' },
  FTM: { primary: '#1969FF', gradient: 'linear-gradient(135deg, #1969FF, #0A43B3)', glyph: 'F' },
  GALA: { primary: '#000000', gradient: 'linear-gradient(135deg, #2D3748, #1A202C)', glyph: 'G' },
  SAND: { primary: '#00ADEF', gradient: 'linear-gradient(135deg, #00ADEF, #0076A6)', glyph: 'S' },
  MANA: { primary: '#FF2D55', gradient: 'linear-gradient(135deg, #FF2D55, #B81534)', glyph: 'M' },
  AXS: { primary: '#0055D5', gradient: 'linear-gradient(135deg, #0055D5, #00378C)', glyph: 'A' },
  IMX: { primary: '#0D0D0D', gradient: 'linear-gradient(135deg, #262626, #0A0A0A)', glyph: 'X' },
  KAVA: { primary: '#FF433E', gradient: 'linear-gradient(135deg, #FF433E, #B82522)', glyph: 'K' },
  OP: { primary: '#FF0420', gradient: 'linear-gradient(135deg, #FF0420, #B80015)', glyph: 'O' },
  TIA: { primary: '#7B2BF9', gradient: 'linear-gradient(135deg, #7B2BF9, #4F13B0)', glyph: 'T' },
  INJ: { primary: '#00E8C6', gradient: 'linear-gradient(135deg, #00BFA5, #00796B)', glyph: 'I' },
  IOST: { primary: '#1C1C1C', gradient: 'linear-gradient(135deg, #333333, #111111)', glyph: 'I' },
  GT: { primary: '#0D72F3', gradient: 'linear-gradient(135deg, #0D72F3, #07479B)', glyph: 'G' },
  PENDLE: { primary: '#2574A9', gradient: 'linear-gradient(135deg, #2574A9, #144669)', glyph: 'P' },
  ENA: { primary: '#181818', gradient: 'linear-gradient(135deg, #333333, #111111)', glyph: 'E' },
};

// Clean symbol string (removes pair suffixes like THB_ or /THB or USDT)
export const cleanCryptoSymbol = (rawSymbol: string): string => {
  if (!rawSymbol) return 'CRYPTO';
  let s = rawSymbol.toUpperCase().trim();
  if (s.startsWith('THB_')) s = s.replace('THB_', '');
  if (s.endsWith('_THB')) s = s.replace('_THB', '');
  if (s.endsWith('/THB')) s = s.replace('/THB', '');
  if (s.endsWith('THB')) s = s.replace(/THB$/, '');
  if (s.endsWith('/USDT')) s = s.replace('/USDT', '');
  if (s.endsWith('USDT')) s = s.replace(/USDT$/, '');
  return s || 'CRYPTO';
};

// Deterministic gradient generator for any arbitrary coin not in the predefined map
const getDeterministicGradient = (str: string): { primary: string; gradient: string } => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 35) % 360;
  const primary = `hsl(${h1}, 75%, 50%)`;
  const gradient = `linear-gradient(135deg, hsl(${h1}, 75%, 52%), hsl(${h2}, 85%, 38%))`;
  return { primary, gradient };
};

export interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showBadgeBorder?: boolean;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol,
  size = 28,
  className = '',
  style = {},
  showBadgeBorder = true,
}) => {
  const cleanSymbol = cleanCryptoSymbol(symbol);
  const lower = cleanSymbol.toLowerCase();

  // Tier 0: CoinCap CDN
  // Tier 1: Spothq GitHub CDN
  // Tier 2: CoinIcons API
  // Tier 3: Fallback SVG Brand Glyph Avatar
  const [tier, setTier] = useState<number>(0);

  const cdnUrls = [
    `https://assets.coincap.io/assets/icons/${lower}@2x.png`,
    `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${lower}.png`,
    `https://coinicons-api.vercel.app/api/icon/${lower}`,
  ];

  const brand = COIN_BRANDS[cleanSymbol] || getDeterministicGradient(cleanSymbol);

  const handleImageError = () => {
    setTier((prev) => prev + 1);
  };

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    background: tier < cdnUrls.length ? 'rgba(0, 0, 0, 0.4)' : brand.gradient,
    border: showBadgeBorder
      ? `1.5px solid ${tier < cdnUrls.length ? 'rgba(255, 255, 255, 0.15)' : brand.primary}`
      : 'none',
    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.35), 0 0 6px ${brand.primary}33`,
    ...style,
  };

  // If still trying CDN tiers, render img with onError fallback
  if (tier < cdnUrls.length) {
    return (
      <div className={`crypto-icon-wrapper ${className}`} style={containerStyle} title={cleanSymbol}>
        <img
          src={cdnUrls[tier]}
          alt={cleanSymbol}
          onError={handleImageError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback: Custom High-Def SVG Avatar with Brand Gradient & Glyph
  const fontSize = Math.max(9, Math.round(size * 0.42));
  const displayText = brand.glyph && brand.glyph.length === 1 ? brand.glyph : cleanSymbol.slice(0, 3);

  return (
    <div
      className={`crypto-icon-wrapper crypto-icon-fallback ${className}`}
      style={containerStyle}
      title={cleanSymbol}
    >
      <span
        style={{
          color: '#FFFFFF',
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          fontFamily: 'var(--font-mono, sans-serif)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
          letterSpacing: '-0.3px',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        {displayText}
      </span>
    </div>
  );
};
