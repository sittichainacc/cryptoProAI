import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  theme = 'dark',
  interval = 'D',
  height = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean symbol and map to major exchange ticker on TradingView
    const cleanSym = symbol.replace(/_THB|THB_|_USDT|USDT/g, '').toUpperCase();
    const tvSymbol = `BINANCE:${cleanSym}USDT`;

    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval === '1D' || interval === '1d' ? 'D' : interval,
      timezone: 'Asia/Bangkok',
      theme: theme,
      style: '1',
      locale: 'th_TH',
      enable_publishing: false,
      backgroundColor: '#0B0F19',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
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
