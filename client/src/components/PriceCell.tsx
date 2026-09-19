import React, { useEffect, useRef, useState } from 'react';

interface PriceCellProps {
  price: number;
  prefix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PriceCell: React.FC<PriceCellProps> = ({
  price,
  prefix = '$',
  decimals,
  className = '',
  style = {},
}) => {
  const prevPriceRef = useRef<number>(price);
  const [flash, setFlash] = useState<'flash-up' | 'flash-down' | ''>('');

  useEffect(() => {
    if (prevPriceRef.current !== undefined && price !== prevPriceRef.current) {
      if (price > prevPriceRef.current) {
        setFlash('flash-up');
      } else if (price < prevPriceRef.current) {
        setFlash('flash-down');
      }
      prevPriceRef.current = price;

      const timer = setTimeout(() => {
        setFlash('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [price]);

  const numDecimals = decimals !== undefined ? decimals : price < 1 ? 4 : 2;
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: numDecimals,
    maximumFractionDigits: numDecimals,
  });

  return (
    <span
      className={`${flash} ${className}`}
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        borderRadius: '4px',
        transition: 'background-color 0.4s ease, color 0.4s ease',
        ...style,
      }}
    >
      {prefix}{formatted}
    </span>
  );
};
