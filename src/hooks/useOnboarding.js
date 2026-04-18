import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'misu_onboarding_done_v2';

export function useOnboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const [tourKey, setTourKey] = useState(0);

  const finish = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  }, []);

  const replay = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setTourKey(k => k + 1); // force OnboardingTour to fully remount
    setShow(true);
  }, []);

  return { showOnboarding: show, tourKey, finishOnboarding: finish, replayOnboarding: replay };
}
