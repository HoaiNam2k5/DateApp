// =====================================================================
//  Âm thanh mini game — tạo bằng Web Audio API nên KHÔNG cần file nhạc.
//  Dùng cho hiệu ứng tick nhiệm vụ, đạt cột mốc bản đồ...
// =====================================================================

const MUTE_KEY = "ldp_game_muted";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    // trình duyệt khoá audio cho tới khi có tương tác — resume khi cần
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

// Một nốt đơn: tần số + thời lượng + dạng sóng, kèm fade nhẹ cho êm tai.
function note(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18) {
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(notes: () => void) {
  if (isMuted()) return;
  notes();
}

/** Tiếng "ting" nhẹ khi hoàn thành một nhiệm vụ. */
export function playDing() {
  play(() => {
    note(880, 0, 0.18, "triangle");
    note(1318.5, 0.05, 0.22, "triangle", 0.12);
  });
}

/** Tiếng "tóc" khi bỏ tick nhiệm vụ. */
export function playPop() {
  play(() => note(330, 0, 0.12, "sine", 0.14));
}

/** Tiếng "soạt" giấy khi lật trang sổ tay (nhiễu trắng qua bộ lọc, tắt dần). */
export function playFlip() {
  play(() => {
    const ac = audioCtx();
    if (!ac) return;
    const dur = 0.2;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = 1 - i / data.length; // bao hình giảm dần
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.7;
    const g = ac.createGain();
    g.gain.value = 0.32;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start();
  });
}

/** Đoạn fanfare vui khi đạt một cột mốc mới trên bản đồ. */
export function playFanfare() {
  play(() => {
    const seq = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    seq.forEach((f, i) => note(f, i * 0.12, 0.3, "triangle", 0.2));
    note(1318.5, 0.5, 0.45, "triangle", 0.14);
  });
}
