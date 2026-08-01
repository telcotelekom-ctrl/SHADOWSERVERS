// User-Space — per-user local archive of apps, media and stickers (localStorage).
export class UserSpace {
  constructor(storageKey = 'image-app-user-space') {
    this.storageKey = storageKey;
    this.state = this._load() || { apps: [], media: [], stickers: [] };
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  _save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }
    catch { /* quota or disabled storage — keep in memory */ }
  }

  addApp(appMeta) { this.state.apps.push(appMeta); this._save(); return appMeta; }
  addMedia(mediaMeta) { this.state.media.push(mediaMeta); this._save(); return mediaMeta; }
  addSticker(stickerMeta) { this.state.stickers.push(stickerMeta); this._save(); return stickerMeta; }

  summary() {
    return { apps: this.state.apps.length, media: this.state.media.length, stickers: this.state.stickers.length };
  }

  clearAll() {
    this.state = { apps: [], media: [], stickers: [] };
    this._save();
  }
}
