import WaveformData from 'waveform-data';

const ROOT_PATH = `/src/data/audio`;

export const loadAudioData = fileName => {
  const path = `${ROOT_PATH}/${fileName}`;

  return fetch(path)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      return WaveformData.create(buffer);
    });
};
