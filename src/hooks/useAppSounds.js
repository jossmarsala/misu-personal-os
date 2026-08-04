import useSound from 'use-sound';

export function useAppSounds() {
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.25 });
  const [playClickOn] = useSound('/sounds/pop-up-on.mp3', { volume: 0.5 });
  const [playClickOff] = useSound('/sounds/pop-up-off.mp3', { volume: 0.5 });
  const [playDrop] = useSound('/sounds/pop-down.mp3', { volume: 0.5 });

  return {
    playHover,
    playClickOn,
    playClickOff,
    playDrop
  };
}
