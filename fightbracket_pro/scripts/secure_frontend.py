import re

app_tsx_path = "c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/App.tsx"
dashboard_path = "c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/AccountDashboard.tsx"

# 1. Update App.tsx
with open(app_tsx_path, "r", encoding="utf-8") as f:
    app_text = f.read()

old_fetch_start = """  async function fetchStartggDirect(slug: string, token?: string | null) {
    if (!token) {
      throw new Error('Start.gg API token required. Please log in with Start.gg or enter your Personal Access Token in Account settings.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };"""

new_fetch_start = """  async function fetchStartggDirect(slug: string, token?: string | null) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to sync from Start.gg');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };"""

app_text = app_text.replace(old_fetch_start, new_fetch_start)
app_text = app_text.replace("'https://api.start.gg/gql/alpha'", "`${API_URL}/api/startgg/proxy`")

with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(app_text)


# 2. Update AccountDashboard.tsx
with open(dashboard_path, "r", encoding="utf-8") as f:
    dash_text = f.read()

old_dash_fetch = """      const res = await fetch('https://api.start.gg/gql/alpha', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${startggToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });"""

new_dash_fetch = """      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/startgg/proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });"""

dash_text = dash_text.replace(old_dash_fetch, new_dash_fetch)

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(dash_text)

print("Frontend secured.")
