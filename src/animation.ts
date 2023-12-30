let frameCount = 0;
let start: number, then: number, elapsed: number;

const fps = 60
const fpsInterval = 1000 / fps;

// kick off an animation with specific conditions
export const startAnimating = (callback: unknown) => {
  then = window.performance.now();
  start = then;
  animate(then, callback);
}

// the animation loop
const animate = (timestamp: number, callback: unknown) => {
  requestAnimationFrame((timestamp) => {
    animate(timestamp, callback)
  });

  elapsed = timestamp - then;

  if (elapsed > fpsInterval) {
    then = timestamp - (elapsed % fpsInterval);

    if (typeof callback === 'function') callback()

    const sinceStart = timestamp - start;
    const currentFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;
  }
}
