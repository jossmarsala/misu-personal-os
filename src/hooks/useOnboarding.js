import { useState } from 'react';

const ONBOARDING_KEY = 'misu_onboarding_done_v1';

export function useOnboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  return { showOnboarding: show, finishOnboarding: finish };
}
