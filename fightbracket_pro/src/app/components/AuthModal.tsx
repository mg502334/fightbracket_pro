import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else { toast.success('Logged in successfully'); onClose(); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else { toast.success('Signed up successfully. Check email for confirmation (if enabled)'); onClose(); }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#050A14] border border-[#00E5FF] p-6 rounded-lg shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[#00E5FF]" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{isLogin ? 'LOG IN' : 'REGISTER'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#111] border border-gray-800 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-[#111] border border-gray-800 rounded p-2 text-white focus:border-[#00E5FF] outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-bold py-2 rounded text-lg transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#FF006E] hover:underline">
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
