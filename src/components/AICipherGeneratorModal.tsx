import React, { useState } from 'react';
import { X, Sparkles, Wand2, Type, AlertCircle, Loader2 } from 'lucide-react';
import { Difficulty, PuzzleData } from '../types';

interface AICipherGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPuzzleGenerated: (newPuzzle: PuzzleData) => void;
}

const PRESET_THEMES = [
  '1969 Zodiac Case Files',
  'Cold War Espionage Cable',
  'San Francisco Detective Noir',
  'Bletchley Park WWII Enigma',
  'Edgar Allan Poe Gothic Crypt',
  'Ancient Alchemist Society',
];

export const AICipherGeneratorModal: React.FC<AICipherGeneratorModalProps> = ({
  isOpen,
  onClose,
  onPuzzleGenerated,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [customText, setCustomText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsGenerating(true);

    try {
      if (isCustomMode && customText.trim().length < 15) {
        setErrorMessage('Custom message must be at least 15 characters long.');
        setIsGenerating(false);
        return;
      }

      if (isCustomMode) {
        // Create custom player-encoded cryptogram directly
        const cleanText = customText.trim().toUpperCase().replace(/[^A-Z\s.,'?!-]/g, '');
        const newPuzzle: PuzzleData = {
          id: `custom_${Date.now()}`,
          editionDate: new Date().toISOString().split('T')[0],
          editionNumber: 999,
          title: 'CUSTOM ENCRYPTED DISPATCH',
          headline: 'AUTHENTIC PLAYER ENCODED CIPHER',
          subheadline: 'A custom crafted coded dispatch ready for codebreaking.',
          authorOrSource: 'Custom Agent Dispatch',
          originalText: cleanText,
          difficulty,
          theme: 'Custom Player Cipher',
          category: 'AI Generated',
          hints: [
            { letter: cleanText.charAt(0), clue: `Starts with the letter ${cleanText.charAt(0)}.` },
          ],
        };
        onPuzzleGenerated(newPuzzle);
        onClose();
        return;
      }

      // Generate with AI backend
      const res = await fetch('/api/generate-ai-cipher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          difficulty,
          customPrompt: customPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.puzzle) {
        onPuzzleGenerated(data.puzzle);
        onClose();
      } else {
        setErrorMessage(data.error || 'Could not generate cryptogram. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while contacting AI Bureau.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-[#fcf9f2] w-full max-w-2xl rounded-sm border-2 border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-3 sm:p-4 flex items-center justify-between border-b-2 border-amber-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-masthead font-bold tracking-wide text-amber-100 uppercase">
                AI Mystery Cipher Forge
              </h2>
              <p className="text-[11px] font-mono-code text-stone-400">
                Generate Instant Zodiac Cryptograms or Encode Custom Messages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-3 sm:px-4 py-2 bg-[#f4eee1] border-b border-stone-400 flex items-center gap-2 text-xs font-mono-code">
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xs cursor-pointer ${
              !isCustomMode
                ? 'bg-stone-900 text-amber-100 shadow-xs'
                : 'bg-[#faf6ee] text-stone-700 hover:bg-stone-200 border border-stone-400'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Story Generation</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xs cursor-pointer ${
              isCustomMode
                ? 'bg-stone-900 text-amber-100 shadow-xs'
                : 'bg-[#faf6ee] text-stone-700 hover:bg-stone-200 border border-stone-400'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Encode Custom Text</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-newsprint space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-900 text-xs font-mono-code rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isCustomMode ? (
            <>
              {/* Theme Selection */}
              <div>
                <label className="block text-xs font-mono-code font-bold uppercase text-stone-700 mb-1.5">
                  Select Cipher Mystery Theme:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-newspaper">
                  {PRESET_THEMES.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-2.5 text-left border rounded-xs transition-colors cursor-pointer ${
                        selectedTheme === theme
                          ? 'bg-amber-200/90 border-stone-900 ring-1 ring-stone-900 font-bold text-stone-950'
                          : 'bg-[#fdfbf6] hover:bg-amber-50 border-stone-400 text-stone-800'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom AI Prompt */}
              <div>
                <label className="block text-xs font-mono-code font-bold uppercase text-stone-700 mb-1">
                  Optional Topic / Mystery Details (e.g., "Set in foggy Victorian London"):
                </label>
                <input
                  type="text"
                  placeholder="Enter optional storyline clue or keywords..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-400 rounded-xs text-xs font-newspaper text-stone-900"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-mono-code font-bold uppercase text-stone-700 mb-1">
                Enter Your Custom Secret Message to Encrypt:
              </label>
              <textarea
                required
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type any quote, phrase, or secret cipher message here..."
                className="w-full p-3 bg-white border border-stone-400 rounded-xs text-xs font-typewriter text-stone-900 uppercase"
              />
              <span className="text-[11px] font-newspaper text-stone-600 block mt-1">
                Will be transformed into an authentic Zodiac monoalphabetic substitution puzzle.
              </span>
            </div>
          )}

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-mono-code font-bold uppercase text-stone-700 mb-1.5">
              Cipher Difficulty:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono-code">
              {(['Beginner', 'Intermediate', 'Master'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 text-center border font-bold rounded-xs cursor-pointer ${
                    difficulty === d
                      ? 'bg-stone-900 text-amber-100 border-stone-900 shadow-xs'
                      : 'bg-[#faf6ee] text-stone-800 hover:bg-stone-200 border-stone-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-amber-50 font-mono-code font-bold text-xs uppercase tracking-wider rounded-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                  <span>Transcribing Zodiac Glyphs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{isCustomMode ? 'Encode & Play Now' : 'Forge AI Cryptogram'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
