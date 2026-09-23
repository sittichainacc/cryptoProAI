import React, { useEffect, useRef } from 'react';
import { toTradingViewInterval } from '../utils/chartIndicatorStorage.js';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
  studies?: Array<{ id: string; inputs?: Record<string, any> } | string>;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  theme = 'dark',
  interval = '1D',
  height = 580,
  studies,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const studiesKey = JSON.stringify(studies || []);
  const tvInterval = toTradingViewInterval(interval);

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

    const isLight = theme === 'light';
    const widgetConfig: Record<string, any> = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Asia/Bangkok',
      theme: isLight ? 'light' : 'dark',
      style: '1',
      locale: 'th_TH',
      enable_publishing: false,
      backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
      gridColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    };

    if (studies && studies.length > 0) {
      widgetConfig.studies = studies;
    }

    script.innerHTML = JSON.stringify(widgetConfig);

    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, studiesKey]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        height,
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: theme === 'light' ? '#FFFFFF' : '#0B0F19',
      }}
    />
  );
};
