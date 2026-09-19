import React, { useEffect, useRef } from 'react';

interface TradingViewTechnicalGaugeProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
}

export const TradingViewTechnicalGauge: React.FC<TradingViewTechnicalGaugeProps> = ({
  symbol,
  theme = 'dark',
  interval = '1D',
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cleanSym = symbol.replace(/_THB|THB_|_USDT|USDT/g, '').toUpperCase();
    const tvSymbol = `BINANCE:${cleanSym}USDT`;

    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: interval,
      width: '100%',
      isTransparent: true,
      height: '100%',
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'th_TH',
      colorTheme: theme,
    });

    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
};
