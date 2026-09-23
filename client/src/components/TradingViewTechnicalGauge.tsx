import React, { useState, useEffect } from 'react';

interface TradingViewTechnicalGaugeProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
}

export const TradingViewTechnicalGauge: React.FC<TradingViewTechnicalGaugeProps> = ({
  symbol,
  theme,
  interval = '1D',
  height = '100%',
}) => {
  const getAppTheme = (): 'dark' | 'light' =>
    document.documentElement.classList.contains('light') ? 'light' : 'dark';

  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>(() => theme || getAppTheme());

  useEffect(() => {
    if (theme) {
      setActiveTheme(theme);
      return;
    }
    const observer = new MutationObserver(() => {
      setActiveTheme(getAppTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  const cleanSym = symbol.replace(/_THB|THB_|_USDT|USDT/g, '').toUpperCase();
  const tvSymbol = cleanSym === 'KUB' ? 'BITKUB:KUB_THB' : `BINANCE:${cleanSym}USDT`;

  const isLight = activeTheme === 'light';
  const bgColor = isLight ? '#FFFFFF' : '#0B101E';

  // Completely isolated HTML inside srcDoc so it NEVER conflicts with MainChartWidget in the main DOM
  const srcDoc = `<!DOCTYPE html>
<html lang="th" style="width:100%;height:100%;margin:0;padding:0;">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${bgColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .tradingview-widget-container {
      width: 100% !important;
      height: 100% !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      background-color: ${bgColor} !important;
    }
    .tradingview-widget-container__widget {
      width: 100% !important;
      height: 100% !important;
      flex: 1 !important;
    }
    iframe {
      width: 100% !important;
      height: 100% !important;
      background-color: ${bgColor} !important;
    }
  </style>
</head>
<body>
  <div class="tradingview-widget-container">
    <div class="tradingview-widget-container__widget"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" async>
    {
      "interval": "${interval}",
      "width": "100%",
      "isTransparent": true,
      "height": "100%",
      "symbol": "${tvSymbol}",
      "showIntervalTabs": true,
      "displayMode": "single",
      "locale": "th_TH",
      "colorTheme": "${activeTheme}"
    }
    </script>
  </div>
</body>
</html>`;

  return (
    <div
      className="tradingview-gauge-container"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%',
        flex: 1,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: bgColor,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe
        key={`${tvSymbol}-${interval}-${activeTheme}`}
        srcDoc={srcDoc}
        title="TradingView Technical Consensus Meter"
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          border: 'none',
          backgroundColor: bgColor,
          display: 'block',
          borderRadius: '12px',
        }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
};
