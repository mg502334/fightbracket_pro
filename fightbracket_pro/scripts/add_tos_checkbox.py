import re

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/AccountDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add agreedToTerms state
state_pattern = r'const \[email, setEmail\] = useState\(\'\'\);'
if 'agreedToTerms' not in text:
    text = re.sub(state_pattern, "const [email, setEmail] = useState('');\n  const [agreedToTerms, setAgreedToTerms] = useState(false);", text)

# 2. Add validation in handleAuthSubmit
auth_submit_pattern = r'if \(password !== confirmPassword\) \{\s*toast\.error\(\'Passwords do not match\'\);\s*return;\s*\}'
if 'agreedToTerms' not in re.search(r'const handleAuthSubmit.*?if \(!isLogin\)', text, re.DOTALL) and 'agreedToTerms' not in text[text.find('handleAuthSubmit'):text.find('handleAuthSubmit')+500]:
    validation_code = """      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!agreedToTerms) {
        toast.error('You must agree to the Terms of Service and Privacy Policy to create an account.');
        return;
      }"""
    text = text.replace("      if (password !== confirmPassword) {\n        toast.error('Passwords do not match');\n        return;\n      }", validation_code)


# 3. Add Checkbox UI
checkbox_ui = """
              {!isLogin && (
                <div className="flex items-start gap-3 mt-4 mb-2 p-3 border border-white/10 rounded-lg bg-black/20">
                  <input
                    type="checkbox"
                    id="tos-consent"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 shrink-0 accent-[#00E5FF] w-4 h-4 rounded-sm border-white/20 bg-[#111]"
                  />
                  <label htmlFor="tos-consent" className="text-xs text-gray-400 font-mono leading-tight">
                    I agree to the FightBracket Pro <button type="button" onClick={() => window.dispatchEvent(new Event('open-tos'))} className="text-[#00E5FF] hover:underline">Terms of Service</button> and <button type="button" onClick={() => window.dispatchEvent(new Event('open-privacy'))} className="text-[#00E5FF] hover:underline">Privacy Policy</button>
                  </label>
                </div>
              )}

              <button
"""
if 'tos-consent' not in text:
    # Find the submit button
    submit_btn_pattern = r'<\s*button\s+type="submit".*?>\s*<span>\{isLogin \? \'SIGN IN\' : \'CREATE ACCOUNT\'\}</span>'
    
    # We want to place the checkbox right before the submit button
    # Let's find '<button\n                type="submit"' or similar
    
    parts = text.split('type="submit"')
    if len(parts) > 1:
        # Find the start of the button tag
        idx = parts[0].rfind('<button')
        text = text[:idx] + checkbox_ui.replace('<button\n', '<button\n') + text[idx:]


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('AccountDashboard.tsx updated with TOS Checkbox!')
