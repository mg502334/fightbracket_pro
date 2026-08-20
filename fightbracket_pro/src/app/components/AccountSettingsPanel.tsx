import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { User, Shield, Link, Bell, AlertTriangle, Globe } from 'lucide-react';
import { SettingsCard, SettingsInput, SaveButton, Toggle, VisibilitySelect } from './SettingsUI';

type SettingsTab = "profile" | "privacy" | "integrations" | "notifications" | "danger";

const settingsTabs: { id: SettingsTab; icon: React.ElementType; label: string }[] = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "privacy", icon: Shield, label: "Privacy" },
  { id: "integrations", icon: Link, label: "Integrations" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "danger", icon: AlertTriangle, label: "Danger Zone" },
];

export function AccountSettingsPanel({ user, userProfile, fetchUserProfile, getHeaders }: { user: any, userProfile: any, fetchUserProfile: () => void, getHeaders: () => Promise<Record<string, string>> }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Local states
  const [firstName, setFirstName] = useState(userProfile?.first_name || '');
  const [lastName, setLastName] = useState(userProfile?.last_name || '');
  const [displayName, setDisplayName] = useState(userProfile?.gamer_tag || user?.user_metadata?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [profileColor, setProfileColor] = useState(userProfile?.profile_color || '');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userStartggInput, setUserStartggInput] = useState(userProfile?.startgg_slug || '');
  const [startggToken, setStartggToken] = useState(userProfile?.startgg_token === 'SECURE_HIDDEN' ? '' : (userProfile?.startgg_token || ''));
  const [userTekkenId, setUserTekkenId] = useState(userProfile?.tekken_id || '');
  const [userSteamId, setUserSteamId] = useState(userProfile?.steam_id || '');
  const [userTwitchId, setUserTwitchId] = useState(userProfile?.twitch_id || '');
  const [userTwitchUrl, setUserTwitchUrl] = useState(userProfile?.twitch_url || '');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(userProfile?.discord_webhook_url || '');
  const [discordServerId, setDiscordServerId] = useState(userProfile?.discord_server_id || '');
  const [testingWebhook, setTestingWebhook] = useState(false);
  
  // Toggles State
  const [toggles, setToggles] = useState({
    notify_announcements: userProfile?.notify_announcements ?? true,
    notify_messages: userProfile?.notify_messages ?? true,
    sound_notifications: userProfile?.sound_notifications ?? true,
    sound_messages: userProfile?.sound_messages ?? true,
    is_public: userProfile?.is_public ?? true,
    friends_only: userProfile?.friends_only ?? false
  });

  // Updating States
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setDisplayName(userProfile.gamer_tag || user?.user_metadata?.displayName || '');
      setBio(userProfile.bio || '');
      setProfileColor(userProfile.profile_color || '');
      setUserStartggInput(userProfile.startgg_slug || '');
      setStartggToken(userProfile.startgg_token === 'SECURE_HIDDEN' ? '' : (userProfile.startgg_token || ''));
      setUserTekkenId(userProfile.tekken_id || '');
      setUserSteamId(userProfile.steam_id || '');
      setUserTwitchId(userProfile.twitch_id || '');
      setUserTwitchUrl(userProfile.twitch_url || '');
      setDiscordWebhookUrl(userProfile.discord_webhook_url || '');
      setDiscordServerId(userProfile.discord_server_id || '');
      
      setToggles({
        notify_announcements: userProfile.notify_announcements ?? true,
        notify_messages: userProfile.notify_messages ?? true,
        sound_notifications: userProfile.sound_notifications ?? true,
        sound_messages: userProfile.sound_messages ?? true,
        is_public: userProfile.is_public ?? true,
        friends_only: userProfile.friends_only ?? false
      });
    }
  }, [userProfile, user]);
  
  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ first_name: firstName, last_name: lastName, gamer_tag: displayName, bio, profile_color: profileColor })
      });
      fetchUserProfile();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
    setUpdatingProfile(false);
  };

  const handleUpdateAvatar = async () => {
    if (!newAvatarUrl) return;
    setUpdatingAvatar(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ avatar_url: newAvatarUrl })
      });
      fetchUserProfile();
      setNewAvatarUrl('');
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to update avatar');
    }
    setUpdatingAvatar(false);
  };

  const handleUpdateEmail = async () => {
    setUpdatingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check both your old and new emails for confirmation links');
      setNewEmail('');
    }
    setUpdatingEmail(false);
  };

  const handleUpdatePassword = async () => {
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated securely!');
      setNewPassword('');
    }
    setUpdatingPassword(false);
  };

  const handleToggleSetting = async (field: 'is_public' | 'friends_only' | 'notify_announcements' | 'notify_messages' | 'sound_notifications' | 'sound_messages', currentValue: boolean) => {
    const newValue = !currentValue;
    setToggles(prev => ({ ...prev, [field]: newValue }));
    
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: newValue })
      });
      fetchUserProfile();
    } catch {
      toast.error('Failed to update settings');
      setToggles(prev => ({ ...prev, [field]: currentValue }));
    }
  };

  const saveIntegrationData = async (payload: any) => {
    setSavingIntegration(true);
    try {
      const headers = await getHeaders();
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      fetchUserProfile();
      toast.success('Integration saved!');
    } catch {
      toast.error('Failed to save integration');
    }
    setSavingIntegration(false);
  };

  const handleTestWebhook = async () => {
    if (!discordWebhookUrl) {
      toast.error('Enter a webhook URL first.');
      return;
    }
    setTestingWebhook(true);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/discord/test-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify({ webhook_url: discordWebhookUrl })
      });
      if (res.ok) {
        toast.success('✅ Test embed sent to Discord!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to send test webhook.');
      }
    } catch {
      toast.error('Network error sending test webhook.');
    }
    setTestingWebhook(false);
  };

  const copyId = () => {
    if (userProfile?.unique_id) {
      navigator.clipboard.writeText(userProfile.unique_id);
      toast.success('Copied FB-ID!');
    }
  };

  const handleLinkIdentity = async (provider: 'discord' | 'twitch' | 'google') => {
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: window.location.origin } });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl w-full">
      {/* Settings sidebar */}
      <div className="flex lg:flex-col gap-1 lg:w-56 flex-shrink-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {settingsTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 lg:w-full text-left group"
            style={{
              color: activeTab === id ? "#00E5FF" : "#8a8a9a",
              background: activeTab === id ? "rgba(0, 229, 255, 0.1)" : "transparent",
              borderLeft: activeTab === id ? "3px solid #00E5FF" : "3px solid transparent",
              borderTopRightRadius: "4px",
              borderBottomRightRadius: "4px"
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      <div className="flex-1 min-w-0">
        
        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Public Identity" description="How you appear to other players and TOs on the platform.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <SettingsInput label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <SettingsInput label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="mb-4">
                <SettingsInput label="Gamer Tag / Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} helper="This is how you appear in brackets and leaderboards." />
              </div>
              <div className="mb-5">
                <SettingsInput label="Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Main character, stream schedule, etc..." />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-2">Profile Modal Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {['#00E5FF', '#FF006E', '#FF3366', '#00F0FF', '#FFB800', '#9D4EDD', '#00FF9D'].map(color => (
                    <button
                      key={color}
                      onClick={() => setProfileColor(color)}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: profileColor === color ? 'white' : 'transparent',
                        boxShadow: profileColor === color ? `0 0 10px ${color}` : 'none'
                      }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="color" 
                      value={profileColor || '#00E5FF'} 
                      onChange={e => setProfileColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">Custom</span>
                  </div>
                  {profileColor && (
                    <button onClick={() => setProfileColor('')} className="ml-auto text-xs font-mono text-red-400 hover:text-red-300 transition-colors">Clear</button>
                  )}
                </div>
              </div>
              <div className="flex justify-end"><SaveButton onClick={handleUpdateProfile} loading={updatingProfile} /></div>
            </SettingsCard>

            <SettingsCard title="Avatar" description="Used in event headers and your public profile.">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center text-xl font-bold text-[#050A14] flex-shrink-0 bg-[#00E5FF] rounded-lg">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    displayName.substring(0,2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) setNewAvatarUrl(event.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 bg-[#111] border border-gray-800 rounded-lg p-2 text-white outline-none font-mono text-sm w-full"
                  />
                  <div className="flex justify-start">
                    <SaveButton label="UPLOAD AVATAR" onClick={handleUpdateAvatar} disabled={!newAvatarUrl} loading={updatingAvatar} />
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Unique FB-ID" description="Your permanent platform identifier.">
              <div className="flex items-center gap-3 p-3 mb-1 bg-[#111] border border-white/10 rounded-lg">
                <code className="flex-1 text-sm font-mono text-[#00E5FF] font-bold">{userProfile?.unique_id || 'Generating...'}</code>
                <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  COPY
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Account Credentials" description="Update your login email or password.">
              <div className="mb-4">
                <SettingsInput label="Email Address" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
                <div className="flex justify-end mt-2"><SaveButton label="UPDATE EMAIL" onClick={handleUpdateEmail} disabled={!newEmail} loading={updatingEmail} /></div>
              </div>
              <div className="mb-2 pt-4 border-t border-white/5">
                <SettingsInput label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" helper="Minimum 8 characters." />
                <div className="flex justify-end mt-2"><SaveButton label="UPDATE PASSWORD" onClick={handleUpdatePassword} disabled={!newPassword} loading={updatingPassword} /></div>
              </div>
            </SettingsCard>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Profile Visibility" description="Control who can find and view your player profile.">
              <Toggle label="Publicly Searchable Profile" description="Allow other users to find you by name or tag." checked={toggles.is_public} onChange={() => handleToggleSetting('is_public', toggles.is_public)} />
              <Toggle label="Friends-Only Start.gg Stats" description="Limit Start.gg placement records to friends only." checked={toggles.friends_only} onChange={() => handleToggleSetting('friends_only', toggles.friends_only)} />
            </SettingsCard>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="animate-in fade-in duration-300">
            
            <SettingsCard title="Linked Authentication" description="Link external accounts to sign in with one click.">
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleLinkIdentity('discord')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-[#5865F2] font-bold text-xs transition-all font-mono">
                  LINK DISCORD
                </button>
                <button onClick={() => handleLinkIdentity('twitch')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#9146FF]/20 hover:bg-[#9146FF]/30 border border-[#9146FF]/50 text-[#9146FF] font-bold text-xs transition-all font-mono">
                  LINK TWITCH
                </button>
                <button onClick={() => handleLinkIdentity('google')} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all font-mono">
                  LINK GOOGLE
                </button>
              </div>
            </SettingsCard>
            
            <SettingsCard title="Start.gg Integration" description="Connect your Start.gg account to import brackets and tournament history.">
              <div className="flex flex-col gap-4 mb-5">
                <div className="mb-2">
                  <SettingsInput label="API Token" value={startggToken} onChange={e => setStartggToken(e.target.value)} type="password" placeholder={userProfile?.startgg_token === 'SECURE_HIDDEN' ? '•••••••••••••••• (Saved)' : ''} helper="Generate tokens at start.gg/admin/profile/developer" />
                </div>
                <div className="flex justify-end"><SaveButton label="SAVE TOKEN" onClick={() => saveIntegrationData({ startgg_token: startggToken })} loading={savingIntegration} /></div>
                
                <div className="mb-2 mt-4">
                  <SettingsInput label="Profile Slug" value={userStartggInput} onChange={e => setUserStartggInput(e.target.value)} placeholder="e.g. mang0" />
                </div>
                <div className="flex justify-end"><SaveButton label="SAVE SLUG" onClick={() => saveIntegrationData({ startgg_slug: userStartggInput })} loading={savingIntegration} /></div>
              </div>
            </SettingsCard>

            <SettingsCard title="Game IDs" description="Link your game specific IDs to display live stats.">
              <div className="mb-4">
                <SettingsInput label="Tekken 8 Polaris ID" value={userTekkenId} onChange={e => setUserTekkenId(e.target.value)} placeholder="e.g. 1234-5678-9012" />
                <div className="flex justify-end mt-2"><SaveButton onClick={() => saveIntegrationData({ tekken_id: userTekkenId })} loading={savingIntegration} /></div>
              </div>
              <div className="mb-4 pt-4 border-t border-white/5">
                <SettingsInput label="Steam ID / Vanity URL" value={userSteamId} onChange={e => setUserSteamId(e.target.value)} placeholder="e.g. 76561198000000000" />
                <div className="flex justify-end mt-2"><SaveButton onClick={() => saveIntegrationData({ steam_id: userSteamId })} loading={savingIntegration} /></div>
              </div>
              <div className="mb-4 pt-4 border-t border-white/5">
                <SettingsInput label="Twitch Username" value={userTwitchId} onChange={e => setUserTwitchId(e.target.value)} placeholder="e.g. fightbracket" />
                <SettingsInput label="Twitch URL" value={userTwitchUrl} onChange={e => setUserTwitchUrl(e.target.value)} placeholder="e.g. https://twitch.tv/..." />
                <div className="flex justify-end mt-2"><SaveButton onClick={() => saveIntegrationData({ twitch_id: userTwitchId, twitch_url: userTwitchUrl })} loading={savingIntegration} /></div>
              </div>
            </SettingsCard>

            <SettingsCard title="Discord Integration" description="Connect your Discord server for automated match callouts, results, and announcements.">
              {/* Webhook Section */}
              <div className="mb-5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook URL</label>
                <p className="text-[11px] font-mono text-gray-600 mb-2">
                  Discord Server → Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
                </p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <SettingsInput
                      label=""
                      value={discordWebhookUrl}
                      onChange={e => setDiscordWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      type="password"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !discordWebhookUrl}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: 'rgba(88,101,242,0.5)', color: '#5865F2', background: 'rgba(88,101,242,0.1)' }}
                  >
                    {testingWebhook ? 'SENDING...' : 'TEST WEBHOOK'}
                  </button>
                  <SaveButton
                    label="SAVE WEBHOOK"
                    onClick={() => saveIntegrationData({ discord_webhook_url: discordWebhookUrl })}
                    loading={savingIntegration}
                  />
                </div>
              </div>

              {/* Server Widget Section */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-xs font-rajdhani font-bold text-gray-400 uppercase tracking-wider mb-1">Server ID (Widget)</label>
                <p className="text-[11px] font-mono text-gray-600 mb-2">
                  Enable Widget in Discord Server Settings → Widget → Enable Server Widget. The numeric Server ID appears there.
                </p>
                <SettingsInput
                  label=""
                  value={discordServerId}
                  onChange={e => setDiscordServerId(e.target.value)}
                  placeholder="e.g. 1234567890123456789"
                />
                <div className="flex justify-end mt-2">
                  <SaveButton
                    label="SAVE SERVER ID"
                    onClick={() => saveIntegrationData({ discord_server_id: discordServerId })}
                    loading={savingIntegration}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="animate-in fade-in duration-300">
            <SettingsCard title="Email Notifications">
              <Toggle label="Platform announcements" description="New features and platform updates." checked={toggles.notify_announcements} onChange={() => handleToggleSetting('notify_announcements', toggles.notify_announcements)} />
              <Toggle label="Direct Messages" description="When you receive a new message from a friend." checked={toggles.notify_messages} onChange={() => handleToggleSetting('notify_messages', toggles.notify_messages)} />
            </SettingsCard>
            <div className="mt-4">
              <SettingsCard title="In-App Sounds">
                <Toggle label="Sound on Notification" description="Play a subtle ping when you receive a new platform notification." checked={toggles.sound_notifications} onChange={() => handleToggleSetting('sound_notifications', toggles.sound_notifications)} />
                <Toggle label="Sound on Message" description="Play a subtle ping when you receive a direct message." checked={toggles.sound_messages} onChange={() => handleToggleSetting('sound_messages', toggles.sound_messages)} />
              </SettingsCard>
            </div>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="animate-in fade-in duration-300">


            <SettingsCard title="Export Account Data" description="Download a full copy of your account data including events, brackets, and fighter records.">
              <button className="flex items-center gap-2 h-10 px-4 text-sm font-rajdhani font-bold tracking-wider transition-all bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10">
                <Globe size={16} /> REQUEST DATA EXPORT
              </button>
            </SettingsCard>

            <div className="p-5" style={{ background: "#141418", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px" }}>
              <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                <h3 className="uppercase tracking-wide text-sm flex items-center gap-2 text-red-500 font-rajdhani font-bold">
                  <AlertTriangle size={16} /> DELETE ACCOUNT
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4 font-mono leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="h-10 px-6 text-sm font-rajdhani font-bold tracking-wider text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all">
                DELETE MY ACCOUNT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
