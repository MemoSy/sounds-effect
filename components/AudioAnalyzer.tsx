// File: src/components/AudioAnalyzer.ts
class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(128);
  private stream: MediaStream | null = null;
  private noiseThreshold: number = 3; // Lower threshold to be more sensitive

  constructor() {
    // AudioContext is created on user interaction to comply with browser policies
  }

  public async start(): Promise<void> {
    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || 
          (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)()
      }

      // Get microphone access with optimal settings for voice
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Create source from microphone
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      // Create gain node to boost signal
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.5; // Boost the input signal

      // Create analyzer with more sensitivity
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Must be power of 2
      this.analyser.minDecibels = -90; // Increase sensitivity (default is -100)
      this.analyser.maxDecibels = -10; // Keep high end the same (default is -30)
      this.analyser.smoothingTimeConstant = 0.6; // Balance between responsive and smooth

      // Connect the audio processing chain
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      // Create data array based on analyzer buffer length
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Resume audio context (needed for Safari)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  public stop(): void {
    // Disconnect and clean up
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.suspend();
    }
  }

  public getAudioData(): number[] {
    if (!this.analyser) {
      return Array(128).fill(0);
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Process the data to improve visualization
    const processedData = Array.from(this.dataArray).map((value) => {
      // Apply threshold to filter out background noise
      const thresholdedValue = value < this.noiseThreshold ? 0 : value;

      // Apply non-linear scaling to make visualization more dramatic
      // Square root scaling gives more weight to lower amplitudes
      const scaledValue =
        Math.sqrt(thresholdedValue / 255) * (thresholdedValue / 255);

      return scaledValue;
    });

    return processedData;
  }
}

export default AudioAnalyzer;
