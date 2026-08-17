import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 p-5" style={{ background: "#050A14", border: "1px solid rgba(0,229,255,0.2)", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
      <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(0,229,255,0.15)" }}>
        <h3 className="text-[#00E5FF] uppercase tracking-widest text-sm font-rajdhani font-bold">{title}</h3>
        {description && <p className="text-xs mt-1 text-gray-400 font-mono">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsInput({ label, placeholder, type = "text", value, onChange, helper, readOnly }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; helper?: string; readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono font-bold text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-10 px-3 text-sm outline-none transition-all duration-200 placeholder:text-gray-600 font-mono"
        style={{ 
          background: readOnly ? "rgba(255,255,255,0.03)" : "#111", 
          border: "1px solid",
          borderColor: readOnly ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)", 
          color: readOnly ? "#8a8a9a" : "#fff", 
          borderRadius: "8px", 
          cursor: readOnly ? "default" : "text" 
        }}
        onFocus={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "#00E5FF"; }}
        onBlur={(e) => { if (!readOnly) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
      {helper && <p className="text-[11px] text-gray-500 font-mono">{helper}</p>}
    </div>
  );
}

export function SaveButton({ label = "SAVE CHANGES", onClick, loading, disabled }: { label?: string; onClick: () => void; loading?: boolean; disabled?: boolean }) {
  const [saved, setSaved] = useState(false);
  const handle = async () => { 
    if (disabled || loading) return;
    await onClick();
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };
  return (
    <button
      onClick={handle}
      disabled={disabled || loading}
      className={`flex items-center gap-2 h-10 px-6 text-sm font-rajdhani font-bold tracking-wider transition-all duration-150 rounded-lg border ${
        saved ? "bg-green-500/20 text-green-400 border-green-500/50" : 
        (disabled || loading) ? "bg-white/5 text-gray-500 border-gray-700 opacity-50 cursor-not-allowed" : 
        "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/50 hover:bg-[#00E5FF]/20"
      }`}
    >
      {saved ? <><Check size={14} />SAVED</> : loading ? "SAVING..." : label}
    </button>
  );
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <div className="text-sm text-white font-mono">{label}</div>
        {description && <div className="text-xs mt-0.5 text-gray-400 font-mono">{description}</div>}
      </div>
      <button
        onClick={onChange}
        className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-[#00E5FF]' : 'bg-[#2a2a34]'}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export function VisibilitySelect({ label, description, options, value, onChange }: { label: string; description?: string; options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div>
        <div className="text-sm text-white font-mono">{label}</div>
        {description && <div className="text-xs mt-0.5 text-gray-400 font-mono">{description}</div>}
      </div>
      <div className="relative flex-shrink-0">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none h-8 pl-3 pr-7 text-xs font-mono font-bold outline-none cursor-pointer transition-colors"
          style={{ background: "#111", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", borderRadius: "4px" }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#00E5FF]" />
      </div>
    </div>
  );
}
