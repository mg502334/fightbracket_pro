import React, { useState } from 'react';
import { Tag, Sparkles, ExternalLink, Flame, Percent, Gamepad2, ShoppingBag, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface DealItem {
  id: string;
  title: string;
  category: 'game' | 'dlc' | 'gear' | 'merch';
  originalPrice: string;
  salePrice: string;
  discount: string;
  platform: string;
  link: string;
  code?: string;
  badge?: string;
  expiresIn?: string;
}

const DEFAULT_DEALS: DealItem[] = [
  {
    id: 'deal-1',
    title: 'Tekken 8 - Season Pass 2 Pre-Order',
    category: 'dlc',
    originalPrice: '$39.99',
    salePrice: '$29.99',
    discount: '-25%',
    platform: 'Steam / PS5 / Xbox',
    link: 'https://store.steampowered.com/app/1778820/TEKKEN_8/',
    badge: 'HOT DEAL',
    expiresIn: '3 days left'
  },
  {
    id: 'deal-2',
    title: 'Street Fighter 6 - Year 2 Character Pass',
    category: 'dlc',
    originalPrice: '$29.99',
    salePrice: '$19.99',
    discount: '-33%',
    platform: 'PlayStation Store',
    link: 'https://store.playstation.com',
    badge: 'FGC SALE',
    expiresIn: '5 days left'
  },
  {
    id: 'deal-3',
    title: 'Haute42 T16 All-Button Leverless Controller',
    category: 'gear',
    originalPrice: '$89.99',
    salePrice: '$64.99',
    discount: '-28%',
    platform: 'Amazon / AliExpress',
    link: 'https://amazon.com',
    code: 'FIGHTPRO10',
    badge: 'GEAR PICK',
    expiresIn: 'Limited stock'
  },
  {
    id: 'deal-4',
    title: 'Guilty Gear -Strive- Daredevil Edition',
    category: 'game',
    originalPrice: '$59.99',
    salePrice: '$29.99',
    discount: '-50%',
    platform: 'Steam Store',
    link: 'https://store.steampowered.com',
    badge: 'BEST VALUE',
    expiresIn: 'Ends Sunday'
  }
];

interface DealsWidgetProps {
  customDeals?: DealItem[];
  className?: string;
}

export function DealsWidget({ customDeals, className = "" }: DealsWidgetProps) {
  const [deals] = useState<DealItem[]>(customDeals || DEFAULT_DEALS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        background: "#141418",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px"
      }}
    >
      {/* Deals Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ 
          borderColor: "rgba(255,255,255,0.07)",
          background: "linear-gradient(90deg, rgba(236,72,153,0.12) 0%, rgba(20,20,24,0) 100%)" 
        }}
      >
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-pink-400" />
          <h3 
            className="text-white text-xs uppercase tracking-widest font-bold"
            style={{ fontFamily: "'Barlow Condensed', 'Rajdhani', sans-serif", letterSpacing: "0.12em" }}
          >
            FGC DEALS & DISCOUNTS
          </h3>
        </div>
        <span 
          className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider"
          style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.3)" }}
        >
          VERIFIED
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {deals.map((deal) => (
          <a
            key={deal.id}
            href={deal.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2.5 rounded transition-all duration-150 group relative no-underline hover:bg-white/[0.04]"
            style={{
              background: "#181820",
              border: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            {/* Header: Badge & Discount */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span 
                className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider"
                style={{
                  background: deal.category === 'gear' ? "rgba(6,182,212,0.15)" : "rgba(236,72,153,0.15)",
                  color: deal.category === 'gear' ? "#22d3ee" : "#f472b6",
                  border: deal.category === 'gear' ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(236,72,153,0.3)"
                }}
              >
                {deal.badge || deal.category}
              </span>
              <span 
                className="text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono"
                style={{
                  background: "rgba(34,197,94,0.15)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.3)"
                }}
              >
                {deal.discount}
              </span>
            </div>

            {/* Deal Title */}
            <div className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors line-clamp-1 leading-snug">
              {deal.title}
            </div>

            {/* Price & Platform */}
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-gray-500 line-through text-[10px]">{deal.originalPrice}</span>
                <span className="text-white font-bold text-xs text-green-400">{deal.salePrice}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono truncate max-w-[120px]">
                {deal.platform}
              </span>
            </div>

            {/* Coupon Code or Expiration */}
            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.04] text-[9px]">
              {deal.code ? (
                <button
                  onClick={(e) => handleCopyCode(deal.code!, e)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/50 transition-colors"
                >
                  {copiedCode === deal.code ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  <span>CODE: {deal.code}</span>
                </button>
              ) : (
                <span className="text-gray-500 font-mono">
                  {deal.expiresIn || 'Limited Time'}
                </span>
              )}
              <span className="text-pink-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                CLAIM <ExternalLink size={9} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
