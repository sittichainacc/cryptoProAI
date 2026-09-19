import React, { useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  theme?: 'dark' | 'light';
}

export const TradingViewTickerTape: React.FC<TradingViewTickerTapeProps> = ({
  theme = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'BINANCE:BTCUSDT', title: 'BTC/USDT' },
        { proName: 'BINANCE:ETHUSDT', title: 'ETH/USDT' },
        { proName: 'BINANCE:SOLUSDT', title: 'SOL/USDT' },
        { proName: 'BINANCE:BNBUSDT', title: 'BNB/USDT' },
        { proName: 'BINANCE:XRPUSDT', title: 'XRP/USDT' },
        { proName: 'BINANCE:DOGEUSDT', title: 'DOGE/USDT' },
        { proName: 'BINANCE:SUIUSDT', title: 'SUI/USDT' },
        { proName: 'BINANCE:PEPEUSDT', title: 'PEPE/USDT' },
        { proName: 'BINANCE:NEARUSDT', title: 'NEAR/USDT' },
        { proName: 'BINANCE:AVAXUSDT', title: 'AVAX/USDT' },
        { proName: 'BITKUB:BTCTHB', title: 'BTC/THB (Bitkub)' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: theme,
      locale: 'th_TH',
    });

    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', marginBottom: '12px' }}
    />
  );
};
