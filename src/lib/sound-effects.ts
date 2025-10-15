class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSounds();
    }
  }

  private loadSounds() {
    const soundFiles = {
      'quality-high': '/sounds/quality-high.mp3',
      'portfolio': '/sounds/portfolio.mp3',
      'badge-unlock': '/sounds/badge-unlock.mp3',
      'filter-click': '/sounds/filter-click.mp3',
      'photo-hover': '/sounds/photo-hover.mp3',
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.3; // Set default volume to 30%
      this.sounds.set(key, audio);
    });
  }

  play(soundKey: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    this.sounds.forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;