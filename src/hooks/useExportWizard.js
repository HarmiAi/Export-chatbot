import { useCallback, useState } from 'react';
import { buildImportEstimate, WIZARD_PROMPTS } from '../utils/exportCalculator';

const STEP_ORDER = ['product', 'quantity', 'country', 'packaging'];

export function useExportWizard({ appendAssistantMessage, appendEstimateMessage, isLoading }) {
  const [wizard, setWizard] = useState({
    active: false,
    stepIndex: 0,
    data: {},
  });

  const startWizard = useCallback(() => {
    if (isLoading) return;
    setWizard({ active: true, stepIndex: 0, data: {} });
    appendAssistantMessage(
      `Welcome! I'll help you estimate your import costs in a few quick steps.\n\n${WIZARD_PROMPTS.product}`,
      { skipGemini: true }
    );
  }, [appendAssistantMessage, isLoading]);

  const cancelWizard = useCallback(() => {
    setWizard({ active: false, stepIndex: 0, data: {} });
  }, []);

  const processWizardAnswer = useCallback(
    (text) => {
      if (!wizard.active || isLoading) return false;

      const stepKey = STEP_ORDER[wizard.stepIndex];
      const nextData = { ...wizard.data, [stepKey]: text.trim() };
      const nextIndex = wizard.stepIndex + 1;

      if (nextIndex < STEP_ORDER.length) {
        setWizard({ active: true, stepIndex: nextIndex, data: nextData });
        appendAssistantMessage(WIZARD_PROMPTS[STEP_ORDER[nextIndex]], { skipGemini: true });
        return true;
      }

      const estimate = buildImportEstimate(nextData);
      appendAssistantMessage(
        "Here's your **estimated import cost breakdown**. Review the card below — figures are indicative only.",
        { skipGemini: true }
      );
      appendEstimateMessage(estimate);
      setWizard({ active: false, stepIndex: 0, data: {} });
      return true;
    },
    [wizard, isLoading, appendAssistantMessage, appendEstimateMessage]
  );

  return {
    wizardActive: wizard.active,
    startWizard,
    cancelWizard,
    processWizardAnswer,
  };
}
