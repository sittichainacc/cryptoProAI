import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
}

const STORAGE_PREFIX = 'cryptopro_collapsible_';

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  badge,
  badgeColor = 'var(--neon-blue)',
  icon,
  defaultOpen = true,
  action,
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return defaultOpen;
  });

  const [isHovered, setIsHovered] = useState(false);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(next));
    } catch {}
  };

  return (
    <div
      className="collapsible-section-card"
      style={{
        marginBottom: '20px',
        backgroundColor: 'var(--bg-card)',
        border: isOpen ? '1px solid var(--border-color)' : '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: isOpen ? 'var(--shadow-card)' : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Clickable Header Bar */}
      <div
        onClick={toggleOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isHovered
            ? 'var(--bg-card-hover)'
            : isOpen
            ? 'var(--bg-card-inner)'
            : 'transparent',
          borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
          transition: 'all 0.18s ease',
        }}
      >
        {/* Left: Icon, Title, Subtitle, Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${badgeColor}18`,
              border: `1px solid ${badgeColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {title}
              </span>
              {badge && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: `${badgeColor}15`,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}35`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions and Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {action && isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--neon-blue-light)',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {action.label}
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(56, 189, 248, 0.15)',
              border: isOpen ? '1px solid var(--border-color)' : '1px solid rgba(56, 189, 248, 0.35)',
              color: isOpen ? 'var(--text-secondary)' : 'var(--neon-cyan)',
              fontSize: '11.5px',
              fontWeight: 700,
              transition: 'all 0.18s',
            }}
          >
            {isOpen ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{isOpen ? 'ย่อส่วนนี้' : 'เปิดดูเนื้อหา'}</span>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </div>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div
          className="collapsible-content"
          style={{
            padding: '18px 18px',
            backgroundColor: 'transparent',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
