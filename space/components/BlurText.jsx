function BlurText({ text, className = "", delay = 100, stepDuration = 0.35 }) {
  const { motion } = window.Motion;
  const ref = React.useRef(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  const from = { filter: "blur(10px)", opacity: 0, y: 50 };
  const to = {
    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
    opacity: [0, 0.5, 1],
    y: [50, -5, 0],
  };

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: "0.1em" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={from}
          animate={inView ? to : from}
          transition={{
            duration: stepDuration * 2,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: (i * delay) / 1000,
          }}
          style={{ display: "inline-block", marginRight: "0.28em", willChange: "transform, filter, opacity" }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

window.BlurText = BlurText;
