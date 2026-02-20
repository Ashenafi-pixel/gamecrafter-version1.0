/**
 * Coordinate step transitions when leaving Symbol Creation (step 4) in either
 * direction (Next or Previous) to avoid BatcherPipe errors.
 * Pauses SlotMachine BEFORE SpineSymbolPreview tears down so the Batcher
 * never tries to render destroyed Spine geometry.
 */
const SYMBOL_CREATION_STEP = 4;
const TEARDOWN_DELAY_MS = 200;

export const STEP_EVENTS = {
  PAUSE_SLOT: 'slotMachinePauseForTeardown',
  RESUME_SLOT: 'slotMachineResumeAfterTeardown',
} as const;

export function prepareStepTransition(
  fromStep: number,
  toStep: number,
  performTransition: () => void
): void {
  // Guard whenever leaving Symbol Creation step in any direction.
  if (fromStep === SYMBOL_CREATION_STEP && toStep !== SYMBOL_CREATION_STEP) {
    // 1. Pause SlotMachine (stop ticker, detach Spine from scene graph).
    window.dispatchEvent(new CustomEvent(STEP_EVENTS.PAUSE_SLOT));
    // 2. Wait for in-flight render to flush, then change step.
    setTimeout(() => {
      performTransition();
      // 3. Resume SlotMachine after the new step has mounted.
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent(STEP_EVENTS.RESUME_SLOT));
      }, 100);
    }, TEARDOWN_DELAY_MS);
  } else {
    performTransition();
  }
}

