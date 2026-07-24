export const landingReveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
};
