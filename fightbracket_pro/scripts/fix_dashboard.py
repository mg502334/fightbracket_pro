import re

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/AccountDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Dashboard sidebar button onClick
old_dashboard_btn = '''<button
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
            style={{
              color: "#f0ede8",
              background: "rgba(0, 229, 255, 0.1)",
              borderLeft: "2px solid #00E5FF",
              borderRadius: "2px",
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>'''

new_dashboard_btn = '''<button
            onClick={() => setActiveTab("Dashboard")}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
            style={{
              color: activeTab === "Dashboard" ? "#f0ede8" : "#8a8a9a",
              background: activeTab === "Dashboard" ? "rgba(0, 229, 255, 0.1)" : "transparent",
              borderLeft: activeTab === "Dashboard" ? "2px solid #00E5FF" : "2px solid transparent",
              borderRadius: "2px",
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>'''

if old_dashboard_btn in text:
    text = text.replace(old_dashboard_btn, new_dashboard_btn)
else:
    print('Warning: Dashboard btn not found')

# 2. Logout button match RETURN HOME
old_logout_btn = '''<button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-1.5 mr-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
            >
              <LogOut size={14} /> LOG OUT
            </button>'''

new_logout_btn = '''<button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 h-9 px-4 mr-2 text-xs font-semibold text-[#050A14] transition-all duration-150"
              style={{
                background: "#00E5FF",
                borderRadius: "2px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#00B3CC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#00E5FF")}
            >
              <LogOut size={13} />
              LOG OUT
            </button>'''

if old_logout_btn in text:
    text = text.replace(old_logout_btn, new_logout_btn)
else:
    print('Warning: LOG OUT btn not found')


# 3. Notification bell toast
old_bell = '''{/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            </button>'''

new_bell = '''{/* Notification bell */}
            <button onClick={() => toast.info("No new notifications")} className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>
              <Bell size={16} style={{ color: "#8a8a9a" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00E5FF] rounded-full" />
            </button>'''

if old_bell in text:
    text = text.replace(old_bell, new_bell)
else:
    print('Warning: Bell btn not found')


# 4. Search box toast
old_search = '''<div
              className="flex items-center px-3 py-1.5 gap-2 w-64"
              style={{
                background: "#1e1e24",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
            >
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input
                placeholder="Search..."
                className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm font-mono"
                style={{ color: "#f0ede8" }}
              />
            </div>'''

new_search = '''<div
              className="flex items-center px-3 py-1.5 gap-2 w-64"
              style={{
                background: "#1e1e24",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "2px",
              }}
              onClick={() => toast.info("Global search coming soon")}
            >
              <Search size={13} style={{ color: "#8a8a9a" }} />
              <input
                placeholder="Search..."
                className="bg-transparent outline-none flex-1 placeholder:text-white/20 text-sm font-mono"
                style={{ color: "#f0ede8" }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    toast.info("Global search coming soon");
                  }
                }}
              />
            </div>'''

if old_search in text:
    text = text.replace(old_search, new_search)
else:
    print('Warning: Search box not found')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Frontend fixes applied!')
