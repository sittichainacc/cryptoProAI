let currentUsdThbRate = 33.24;

export const setGlobalUsdThbRate = (rate?: number) => {
  if (rate && rate > 0 && !isNaN(rate)) {
    currentUsdThbRate = rate;
  }
};

export const getUsdThbRate = (): number => currentUsdThbRate;

export const getCurrencyMultiplier = (currency: 'THB' | 'USDT' = 'THB', customRate?: number): number => {
  if (currency === 'USDT') return 1;
  if (customRate && customRate > 0) return customRate;
  return currentUsdThbRate;
};

export const formatCurrencyValue = (
  valUsd: number, 
  currency: 'THB' | 'USDT' = 'THB', 
  customRate?: number
): string => {
  const mult = getCurrencyMultiplier(currency, customRate);
  const val = valUsd * mult;
  const prefix = currency === 'THB' ? '฿' : '$';

  if (currency === 'THB') {
    if (val >= 1e12) return `฿${(val / 1e12).toFixed(2)} ล้านล้าน`;
    if (val >= 1e9) return `฿${(val / 1e9).toFixed(2)} พันล้าน`;
    if (val >= 1e6) return `฿${(val / 1e6).toFixed(2)} ล้าน`;
  } else {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  }

  if (val < 0.0001) return `${prefix}${val.toFixed(8)}`;
  if (val < 0.01) return `${prefix}${val.toFixed(6)}`;
  if (val < 1) return `${prefix}${val.toFixed(4)}`;
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPrice = (price: number): string => {
  if (price === undefined || price === null || isNaN(price)) return '-';
  if (price >= 1000) {
    return `฿${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 1) {
    return `฿${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  return `฿${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
};

