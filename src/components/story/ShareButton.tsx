'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  storyId: string;
  storyTitle: string;
}

export function ShareButton({ storyId, storyTitle }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  
  const copyLink = async () => {
    const url = `${window.location.origin}/stories/${storyId}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: Show URL in alert if clipboard fails
      alert(`Copy this link: ${url}`);
    }
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const url = `${window.location.origin}/stories/${storyId}`;
    const text = `Check out this story: ${storyTitle}`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    setShowSocialMenu(false);
  };

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={copyLink}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowSocialMenu(!showSocialMenu);
        }}
        className="bg-white/20 backdrop-blur px-4 py-2 rounded-full hover:bg-white/30 transition text-white flex items-center gap-2"
        aria-label="Share story"
      >
        📤 Share
      </button>
      
      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full mt-2 right-0 bg-white text-black px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap"
          >
            ✓ Link copied!
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Social Media Menu (on right-click) */}
      <AnimatePresence>
        {showSocialMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="flex flex-col min-w-[160px]">
              <button
                onClick={() => shareToSocial('twitter')}
                className="px-4 py-2 text-left hover:bg-black/5 transition text-black flex items-center gap-2 text-sm"
                aria-label="Share on Twitter"
              >
                <span className="text-lg">🐦</span>
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('facebook')}
                className="px-4 py-2 text-left hover:bg-black/5 transition text-black flex items-center gap-2 text-sm"
                aria-label="Share on Facebook"
              >
                <span className="text-lg">📘</span>
                Facebook
              </button>
              <button
                onClick={() => shareToSocial('linkedin')}
                className="px-4 py-2 text-left hover:bg-black/5 transition text-black flex items-center gap-2 text-sm"
                aria-label="Share on LinkedIn"
              >
                <span className="text-lg">💼</span>
                LinkedIn
              </button>
              <button
                onClick={copyLink}
                className="px-4 py-2 text-left hover:bg-black/5 transition text-black flex items-center gap-2 text-sm border-t border-black/10"
                aria-label="Copy link"
              >
                <span className="text-lg">📋</span>
                Copy Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop to close menu */}
      {showSocialMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSocialMenu(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}