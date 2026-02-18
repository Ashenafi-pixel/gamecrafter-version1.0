/**
 * Option 3: Coordinate step transitions when leaving Symbol Creation (step 4)
 * to avoid BatcherPipe errors - pause SlotMachine before SpineSymbolPreview teardown.
 */
const SYMBOL_CREATION_STEP = 4;
const TEARDOWN_DELAY_MS = 150;

export const STEP_EVENTS = {
  PAUSE_SLOT: 'slotMachinePauseForTeardown',
  RESUME_SLOT: 'slotMachineResumeAfterTeardown',
} as const;

export function prepareStepTransition(
  fromStep: number,
  toStep: number,
  performTransition: () => void
): void {
  if (fromStep === SYMBOL_CREATION_STEP && toStep !== SYMBOL_CREATION_STEP) {
    window.dispatchEvent(new CustomEvent(STEP_EVENTS.PAUSE_SLOT));
    setTimeout(() => {
      performTransition();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(STEP_EVENTS.RESUME_SLOT));
      }, 50);
    }, TEARDOWN_DELAY_MS);
  } else {
    performTransition();
  }
}
