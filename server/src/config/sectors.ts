import { Coin, SectorCategory, SectorInfo } from '../types/index.js';

export const SECTORS: Record<SectorCategory, Omit<SectorInfo, 'change24h' | 'change7d' | 'volume24h' | 'marketCapShare' | 'topCoin'>> = {
  core: {
    id: 'core',
    name: 'Core / Large Cap',
    nameTh: 'เหรียญหลัก (Core / Large Cap)',
    description: 'เหรียญหลักของตลาด มี Market Cap และ Liquidity สูง ใช้เป็นตัวกำหนดภาพรวมตลาด',
    color: '#3B82F6', // Neon Blue
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  layer1_2: {
    id: 'layer1_2',
    name: 'Layer 1 / Layer 2',
    nameTh: 'โครงสร้างพื้นฐาน (L1 / L2)',
    description: 'Blockchain Infrastructure และ Scaling Solution',
    color: '#8B5CF6', // Purple
    badgeBg: 'rgba(139, 92, 246, 0.15)',
  },
  defi: {
    id: 'defi',
    name: 'DeFi',
    nameTh: 'การเงินกระจายศูนย์ (DeFi)',
    description: 'Decentralized Finance & Lending/DEX Protocols',
    color: '#06B6D4', // Cyan
    badgeBg: 'rgba(6, 182, 212, 0.15)',
  },
  ai_depin: {
    id: 'ai_depin',
    name: 'AI / Data / DePIN',
    nameTh: 'ปัญญาประดิษฐ์และ DePIN (AI / Data)',
    description: 'Artificial Intelligence, Data และ Decentralized Physical Infrastructure',
    color: '#10B981', // Emerald Green
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  rwa_oracle: {
    id: 'rwa_oracle',
    name: 'RWA / Payment / Oracle',
    nameTh: 'สินทรัพย์จริงและออราเคิล (RWA / Oracle)',
    description: 'Real World Asset, Payment Infrastructure และ Oracle',
    color: '#0284C7', // Sky Blue
    badgeBg: 'rgba(2, 132, 199, 0.15)',
  },
  meme: {
    id: 'meme',
    name: 'Meme / Community',
    nameTh: 'มีมและชุมชน (Meme / Community)',
    description: 'เหรียญที่ขับเคลื่อนด้วย Community และ Momentum',
    color: '#F59E0B', // Amber
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  gamefi: {
    id: 'gamefi',
    name: 'GameFi / Metaverse / NFT',
    nameTh: 'เกมและเมตาเวิร์ส (GameFi / NFT)',
    description: 'Gaming, Metaverse และ NFT Infrastructure',
    color: '#EC4899', // Pink
    badgeBg: 'rgba(236, 72, 153, 0.15)',
  },
  emerging: {
    id: 'emerging',
    name: 'Emerging / New Listing',
    nameTh: 'เหรียญใหม่มาแรง (Emerging / New)',
    description: 'เหรียญใหม่หรือเหรียญขนาดเล็กที่มีโอกาสเติบโตสูง แต่มีความเสี่ยงสูง',
    color: '#EF4444', // Red-Orange
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
};

export const INITIAL_COINS: Coin[] = [
  // Group 1: Core
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', primarySector: 'core', baseAsset: 'BTC', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_BTC', binanceSymbol: 'BTCUSDT' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', primarySector: 'core', baseAsset: 'ETH', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_ETH', binanceSymbol: 'ETHUSDT' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', primarySector: 'core', baseAsset: 'SOL', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_SOL', binanceSymbol: 'SOLUSDT' },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', primarySector: 'core', baseAsset: 'BNB', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_BNB', binanceSymbol: 'BNBUSDT' },

  // Group 2: Layer 1 / Layer 2
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', primarySector: 'layer1_2', baseAsset: 'DOT', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_DOT', binanceSymbol: 'DOTUSDT' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', primarySector: 'layer1_2', baseAsset: 'ADA', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_ADA', binanceSymbol: 'ADAUSDT' },
  { id: 'kava', symbol: 'KAVA', name: 'Kava', primarySector: 'layer1_2', baseAsset: 'KAVA', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_KAVA', binanceSymbol: 'KAVAUSDT' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', primarySector: 'layer1_2', baseAsset: 'AVAX', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_AVAX', binanceSymbol: 'AVAXUSDT' },
  { id: 'sui', symbol: 'SUI', name: 'Sui', primarySector: 'layer1_2', baseAsset: 'SUI', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_SUI', binanceSymbol: 'SUIUSDT' },
  { id: 'sei', symbol: 'SEI', name: 'Sei Network', primarySector: 'layer1_2', baseAsset: 'SEI', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_SEI', binanceSymbol: 'SEIUSDT' },
  { id: 'arb', symbol: 'ARB', name: 'Arbitrum', primarySector: 'layer1_2', baseAsset: 'ARB', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_ARB', binanceSymbol: 'ARBUSDT' },

  // Group 3: DeFi
  { id: 'aave', symbol: 'AAVE', name: 'Aave', primarySector: 'defi', baseAsset: 'AAVE', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_AAVE', binanceSymbol: 'AAVEUSDT' },
  { id: 'jup', symbol: 'JUP', name: 'Jupiter', primarySector: 'defi', baseAsset: 'JUP', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_JUP', binanceSymbol: 'JUPUSDT' },
  { id: 'cake', symbol: 'CAKE', name: 'PancakeSwap', primarySector: 'defi', baseAsset: 'CAKE', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_CAKE', binanceSymbol: 'CAKEUSDT' },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', primarySector: 'defi', baseAsset: 'UNI', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_UNI', binanceSymbol: 'UNIUSDT' },
  { id: 'crv', symbol: 'CRV', name: 'Curve DAO', primarySector: 'defi', baseAsset: 'CRV', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_CRV', binanceSymbol: 'CRVUSDT' },

  // Group 4: AI / Data / DePIN
  { id: 'render', symbol: 'RENDER', name: 'Render', primarySector: 'ai_depin', baseAsset: 'RENDER', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'RENDERUSDT' },
  { id: 'fet', symbol: 'FET', name: 'Artificial Superintelligence', primarySector: 'ai_depin', baseAsset: 'FET', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_FET', binanceSymbol: 'FETUSDT' },
  { id: 'tao', symbol: 'TAO', name: 'Bittensor', primarySector: 'ai_depin', baseAsset: 'TAO', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'TAOUSDT' },
  { id: 'grt', symbol: 'GRT', name: 'The Graph', primarySector: 'ai_depin', baseAsset: 'GRT', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_GRT', binanceSymbol: 'GRTUSDT' },
  { id: 'io', symbol: 'IO', name: 'io.net', primarySector: 'ai_depin', baseAsset: 'IO', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_IO', binanceSymbol: 'IOUSDT' },
  { id: 'flock', symbol: 'FLOCK', name: 'FLock.io', primarySector: 'ai_depin', baseAsset: 'FLOCK', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_FLOCK', binanceSymbol: 'FLOCKUSDT' },

  // Group 5: RWA / Payment / Oracle
  { id: 'link', symbol: 'LINK', name: 'Chainlink', primarySector: 'rwa_oracle', baseAsset: 'LINK', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_LINK', binanceSymbol: 'LINKUSDT' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', primarySector: 'rwa_oracle', baseAsset: 'XRP', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_XRP', binanceSymbol: 'XRPUSDT' },
  { id: 'ach', symbol: 'ACH', name: 'Alchemy Pay', primarySector: 'rwa_oracle', baseAsset: 'ACH', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'ACHUSDT' },
  { id: 'xlm', symbol: 'XLM', name: 'Stellar Lumens', primarySector: 'rwa_oracle', baseAsset: 'XLM', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_XLM', binanceSymbol: 'XLMUSDT' },

  // Group 6: Meme / Community
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', primarySector: 'meme', baseAsset: 'PEPE', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'PEPEUSDT' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', primarySector: 'meme', baseAsset: 'DOGE', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_DOGE', binanceSymbol: 'DOGEUSDT' },
  { id: 'shib', symbol: 'SHIB', name: 'Shiba Inu', primarySector: 'meme', baseAsset: 'SHIB', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_SHIB', binanceSymbol: 'SHIBUSDT' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', primarySector: 'meme', baseAsset: 'BONK', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'BONKUSDT' },
  { id: 'floki', symbol: 'FLOKI', name: 'Floki', primarySector: 'meme', baseAsset: 'FLOKI', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'FLOKIUSDT' },

  // Group 7: GameFi / Metaverse / NFT
  { id: 'imx', symbol: 'IMX', name: 'ImmutableX', primarySector: 'gamefi', baseAsset: 'IMX', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_IMX', binanceSymbol: 'IMXUSDT' },
  { id: 'axs', symbol: 'AXS', name: 'Axie Infinity', primarySector: 'gamefi', baseAsset: 'AXS', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_AXS', binanceSymbol: 'AXSUSDT' },
  { id: 'mana', symbol: 'MANA', name: 'Decentraland', primarySector: 'gamefi', baseAsset: 'MANA', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_MANA', binanceSymbol: 'MANAUSDT' },
  { id: 'gala', symbol: 'GALA', name: 'Gala Games', primarySector: 'gamefi', baseAsset: 'GALA', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_GALA', binanceSymbol: 'GALAUSDT' },
  { id: 'sand', symbol: 'SAND', name: 'The Sandbox', primarySector: 'gamefi', baseAsset: 'SAND', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_SAND', binanceSymbol: 'SANDUSDT' },

  // Group 8: Emerging / High Growth
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', primarySector: 'emerging', baseAsset: 'NEAR', quoteAsset: 'THB', isBitkubPair: true, bitkubSymbol: 'THB_NEAR', binanceSymbol: 'NEARUSDT' },
  { id: 'ton', symbol: 'TON', name: 'Toncoin', primarySector: 'emerging', baseAsset: 'TON', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'TONUSDT' },
  { id: 'apt', symbol: 'APT', name: 'Aptos', primarySector: 'emerging', baseAsset: 'APT', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'APTUSDT' },
  { id: 'wld', symbol: 'WLD', name: 'Worldcoin', primarySector: 'emerging', baseAsset: 'WLD', quoteAsset: 'USDT', isBitkubPair: false, binanceSymbol: 'WLDUSDT' },
];
