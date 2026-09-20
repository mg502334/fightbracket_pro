class TekkenDataSyncer {
  constructor(tekkenId, onUpdateCallback, onErrorCallback) {
    this.tekkenId = tekkenId;
    this.onUpdate = onUpdateCallback;
    this.onError = onErrorCallback;
    this.isSyncing = false;
    this.syncIntervalId = null;
    this.baseInterval = 30000; // Check every 30 seconds default
  }

  // Core single execution sync action
  async executeSync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Simultaneously fetch both profile details and battle history
      const [profileRes, battlesRes] = await Promise.all([
        fetchFromEwgf(`/external/profile/${this.tekkenId}`),
        fetchFromEwgf(`/external/battles/${this.tekkenId}`)
      ]);

      // 2. Synthesize unified dashboard state payload
      const syncPayload = {
        profile: profileRes.data,
        matches: battlesRes.data,
        meta: battlesRes._metadata, // Track free tier daily token limits
        lastSyncedAt: new Date().toLocaleTimeString()
      };

      this.onUpdate(syncPayload);
    } catch (err) {
      this.onError(err.message);
    } finally {
      this.isSyncing = false;
    }
  }

  // Start automated loop background updates
  startAutoSync(intervalMs = this.baseInterval) {
    this.stopAutoSync();
    // Initial sync invocation
    this.executeSync(); 
    // Setup continuous polling
    this.syncIntervalId = setInterval(() => this.executeSync(), intervalMs);
  }

  // Stop background execution safely
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}
