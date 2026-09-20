import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        toast.error(error.message || 'Failed to update password');
      } else {
        toast.success('Password updated successfully!');
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#050A14] border border-[#00E5FF]/30 p-8 rounded-xl shadow-2xl w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#00E5FF]/10 rounded-full text-[#00E5FF]">
              <Key size={32} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center text-[#00E5FF] font-rajdhani tracking-widest">
            RESET PASSWORD
          </h2>
          <p className="text-center text-gray-400 text-sm mb-6 font-mono">
            Please enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-mono">NEW PASSWORD</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full bg-[#111] border border-gray-800 rounded p-2.5 text-white outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-mono">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#111] border border-gray-800 rounded p-2.5 text-white outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded text-sm transition-all tracking-widest mt-6 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-rajdhani disabled:opacity-50"
            >
              {loading ? 'SAVING...' : 'SAVE NEW PASSWORD'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
