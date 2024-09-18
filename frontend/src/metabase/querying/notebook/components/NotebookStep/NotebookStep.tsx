import cx from "classnames";
import { useCallback, useMemo } from "react";
import { t } from "ttag";

import ExpandingContent from "metabase/components/ExpandingContent";
import CS from "metabase/css/core/index.css";
import { useToggle } from "metabase/hooks/use-toggle";
import { color as c } from "metabase/lib/colors";
import type { Query } from "metabase-lib";

import type {
  NotebookStep as INotebookStep,
  NotebookStepAction,
} from "../../types";

import { NotebookActionButton } from "./NotebookActionButton";
import {
  PreviewButton,
  StepActionsContainer,
  StepBody,
  StepButtonContainer,
  StepContent,
  StepRoot,
} from "./NotebookStep.styled";
import { NotebookStepPreview } from "./NotebookStepPreview";
import { getStepConfig } from "./utils";

function hasLargeButton(action: NotebookStepAction) {
  return !getStepConfig(action.type).compact;
}

interface NotebookStepProps {
  step: INotebookStep;
  isLastStep: boolean;
  isLastOpened: boolean;
  reportTimezone: string;
  readOnly?: boolean;
  openStep: (id: string) => void;
  updateQuery: (query: Query) => Promise<void>;
}

export function NotebookStep({
  step,
  isLastStep,
  isLastOpened,
  reportTimezone,
  openStep,
  updateQuery,
  readOnly = false,
}: NotebookStepProps) {
  const [isPreviewOpen, { turnOn: openPreview, turnOff: closePreview }] =
    useToggle(false);

  const actionButtons = useMemo(() => {
    const hasLargeActionButtons =
      isLastStep && step.actions.some(hasLargeButton);

    const actions = step.actions.map(action => {
      const stepUi = getStepConfig(action.type);
      const title = stepUi.title;

      return (
        <NotebookActionButton
          key={`actionButton_${title}`}
          className={cx({
            [cx(CS.mr2, CS.mt2)]: isLastStep,
            [CS.mr1]: !isLastStep,
          })}
          large={hasLargeActionButtons}
          {...stepUi}
          title={title}
          aria-label={title}
          onClick={() => action.action({ openStep })}
        />
      );
    });

    return actions;
  }, [step.actions, isLastStep, openStep]);

  const handleClickRevert = useCallback(() => {
    if (step.revert) {
      const reverted = step.revert(
        step.query,
        step.stageIndex,
        step.itemIndex ?? undefined,
      );
      updateQuery(reverted);
    }
  }, [step, updateQuery]);

  const { title, color, Step, StepHeader } = getStepConfig(step.type);

  // console.log({ actionButtons })

  const canPreview = step.previewQuery != null;
  const hasPreviewButton = !isPreviewOpen && canPreview;
  const canRevert = step.revert != null && !readOnly;

  return (
    <ExpandingContent isInitiallyOpen={!isLastOpened} isOpen>
      <StepRoot
        className={cx(CS.hoverParent, CS.hoverVisibility)}
        data-testid={step.testID}
      >
        <StepContent>
          <StepHeader
            step={step}
            title={title}
            color={color}
            canRevert={canRevert}
            onRevert={handleClickRevert}
          />
        </StepContent>

        <StepBody>
          <StepContent>
            <Step
              step={step}
              query={step.query}
              stageIndex={step.stageIndex}
              color={color}
              updateQuery={updateQuery}
              isLastOpened={isLastOpened}
              reportTimezone={reportTimezone}
              readOnly={readOnly}
            />
          </StepContent>
          {!readOnly && (
            <StepButtonContainer>
              <PreviewButton
                as={NotebookActionButton}
                icon="eye"
                title={t`Preview`}
                color={c("text-light")}
                transparent
                hasPreviewButton={hasPreviewButton}
                onClick={openPreview}
                data-testid="step-preview-button"
              />
            </StepButtonContainer>
          )}
        </StepBody>

        {canPreview && isPreviewOpen && (
          <NotebookStepPreview step={step} onClose={closePreview} />
        )}

        {actionButtons.length > 0 && !readOnly && (
          <StepActionsContainer data-testid="action-buttons">
            {actionButtons}
          </StepActionsContainer>
        )}
      </StepRoot>
    </ExpandingContent>
  );
}
