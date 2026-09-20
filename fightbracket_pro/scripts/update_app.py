import re

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
if 'TermsOfServiceModal' not in text:
    text = text.replace('import { StaticPageModal, type StaticPageId } from "./components/StaticPageModal";', 
                        'import { StaticPageModal, type StaticPageId } from "./components/StaticPageModal";\nimport { TermsOfServiceModal } from "./components/TermsOfServiceModal";')

# 2. State
if 'showTerms' not in text:
    text = re.sub(r'const \[showStaticPage, setShowStaticPage\] = useState<StaticPageId \| null>\(null\);', 
                  'const [showStaticPage, setShowStaticPage] = useState<StaticPageId | null>(null);\n  const [showTerms, setShowTerms] = useState(false);', text)

# 3. Effect for custom events
if 'open-tos' not in text:
    effect_code = """
  useEffect(() => {
    const handleOpenTos = () => setShowTerms(true);
    const handleOpenPrivacy = () => setShowStaticPage('privacy');
    window.addEventListener('open-tos', handleOpenTos);
    window.addEventListener('open-privacy', handleOpenPrivacy);
    return () => {
      window.removeEventListener('open-tos', handleOpenTos);
      window.removeEventListener('open-privacy', handleOpenPrivacy);
    };
  }, []);
"""
    # Insert before the last useEffect or somewhere appropriate
    # Let's just insert it right after the state declarations
    text = text.replace('const [showTerms, setShowTerms] = useState(false);', 'const [showTerms, setShowTerms] = useState(false);\n' + effect_code)

# 4. Render the modal
if '<TermsOfServiceModal' not in text:
    modal_code = """      <TermsOfServiceModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        theme={theme || { id: 'default', displayName: 'FightBracket', shortName: 'FB', primaryColor: '#00E5FF' }}
      />
"""
    text = text.replace('<StaticPageModal', modal_code + '\n      <StaticPageModal')

# 5. Global Footer
footer_code = """
      {/* Global Footer */}
      <footer className="w-full bg-[#050A14] border-t border-white/5 py-6 px-4 mt-auto z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 font-mono text-xs">
            © {new Date().getFullYear()} FightBracket Pro. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest font-rajdhani">
            <button onClick={() => setShowTerms(true)} className="text-gray-400 hover:text-[#00E5FF] transition-colors">
              Terms of Service
            </button>
            <button onClick={() => setShowStaticPage('privacy')} className="text-gray-400 hover:text-[#00E5FF] transition-colors">
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
"""

if 'Global Footer' not in text:
    # Insert right before the last closing div of the main App return
    # Find the last `</div>` before `</>` or whatever the root is.
    # We can just look for the end of the App component.
    # The return usually ends with `    </div>\n  );\n}`
    
    idx = text.rfind('    </div>\n  );\n}')
    if idx != -1:
        text = text[:idx] + footer_code + text[idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('App.tsx updated!')
