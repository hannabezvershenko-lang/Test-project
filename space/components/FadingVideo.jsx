const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // seconds before the end to start fading out

function FadingVideo({ src, className, style }) {
  const videoRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const fadingOutRef = React.useRef(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let restartTimer = null;

    // rAF-driven fade that resumes from whatever opacity the video currently has.
    const fadeTo = (target, duration = FADE_MS) => {
      cancelAnimationFrame(rafRef.current);
      const parsed = parseFloat(video.style.opacity);
      const from = Number.isNaN(parsed) ? 0 : parsed;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        video.style.opacity = String(from + (target - from) * t);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const safePlay = () => {
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    const onLoadedData = () => {
      video.style.opacity = "0";
      safePlay();
      fadeTo(1);
    };

    const onTimeUpdate = () => {
      if (fadingOutRef.current) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const onEnded = () => {
      cancelAnimationFrame(rafRef.current);
      video.style.opacity = "0";
      restartTimer = setTimeout(() => {
        video.currentTime = 0;
        safePlay();
        fadingOutRef.current = false;
        fadeTo(1);
      }, 100);
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    // The video may have loaded before listeners were attached.
    if (video.readyState >= 2) onLoadedData();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(restartTimer);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}

window.FadingVideo = FadingVideo;
