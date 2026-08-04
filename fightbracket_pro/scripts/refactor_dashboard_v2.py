import re

file_path = "c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/AccountDashboard.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import
content = content.replace(
    "import { SteamStatsPanel } from './SteamStatsPanel';",
    "import { SteamStatsPanel } from './SteamStatsPanel';\nimport { AccountSettingsPanel } from './AccountSettingsPanel';"
)

# 2. Update Sidebar Settings Button
sidebar_settings_old = """          <button
            onClick={() => setShowAccountSettingsModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group text-[#8a8a9a] hover:text-[#00E5FF] hover:bg-white/5"
            style={{ borderLeft: "2px solid transparent", borderRadius: "2px" }}
          >"""
sidebar_settings_new = """          <button
            onClick={() => setActiveTab("Settings")}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left w-full group"
            style={{
              color: activeTab === "Settings" ? "#f0ede8" : "#8a8a9a",
              background: activeTab === "Settings" ? "rgba(0, 229, 255, 0.1)" : "transparent",
              borderLeft: activeTab === "Settings" ? "2px solid #00E5FF" : "2px solid transparent",
              borderRadius: "2px",
            }}
          >"""
content = content.replace(sidebar_settings_old, sidebar_settings_new)

# 3. Add Log Out to Header
header_bell_old = """            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>"""
header_bell_new = """            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-3 py-1.5 mr-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
            >
              <LogOut size={14} /> LOG OUT
            </button>

            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/5" style={{ borderRadius: "2px" }}>"""
content = content.replace(header_bell_old, header_bell_new)

# 4. Wrap Dashboard Content
dashboard_start = """        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Page heading */}
          <div className="mb-6">"""
dashboard_new = """        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "Settings" ? (
            <AccountSettingsPanel
              user={user}
              userProfile={userProfile}
              fetchUserProfile={fetchUserProfile}
              getHeaders={getHeaders}
            />
          ) : (
            <>
          {/* Page heading */}
          <div className="mb-6">"""
content = content.replace(dashboard_start, dashboard_new)

# 5. Fix end of file
new_end_of_file = """      </div>
      </>
    )}
  </main>
</div>
</div>
</div>
  );
}
"""

modal_start_idx = content.find("      {/* Account Settings Modal Overlay */}")
if modal_start_idx != -1:
    content = content[:modal_start_idx] + new_end_of_file

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Refactoring v2 complete.")
