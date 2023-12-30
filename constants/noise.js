const randomNum = (min, max) => Math.random() * (max - min) + min;
const randomNumRound = (min, max) => Math.round(randomNum(min, max));

export const noiseParams = {
  seed: randomNumRound(0, 1000),
  terrain: {
    scale: randomNumRound(20, 90),
    magnitude: randomNum(0.1, 0.9),
    offset: randomNum(0.1, 0.9),
  }
}

export default noiseParams;