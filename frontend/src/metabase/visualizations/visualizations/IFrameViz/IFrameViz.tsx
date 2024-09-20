import { useCallback, useMemo } from "react";
import _ from "underscore";

import { getParameterValues } from "metabase/dashboard/selectors";
import { useSelector } from "metabase/lib/redux";
import { fillParametersInText } from "metabase/visualizations/shared/utils/parameter-substitution";
import type {
  Dashboard,
  VirtualDashboardCard,
  VisualizationSettings,
} from "metabase-types/api";

import {
  IFrameEditWrapper,
  IFrameWrapper,
  StyledInput,
} from "./IFrameViz.styled";
import { settings } from "./IFrameVizSettings";
import { prepareIFrameOrUrl } from "./utils";

export interface IFrameVizProps {
  dashcard: VirtualDashboardCard;
  dashboard: Dashboard;
  isEditing: boolean;
  onUpdateVisualizationSettings: (newSettings: VisualizationSettings) => void;
  settings: VisualizationSettings;
  isEditingParameter?: boolean;
  width: number;
  height: number;
  gridSize: {
    width: number;
    height: number;
  };
}

function IFrameVizInner({
  dashcard,
  dashboard,
  isEditing,
  onUpdateVisualizationSettings,
  settings,
  isEditingParameter,
  width,
  height,
  gridSize,
}: IFrameVizProps) {
  const { iframe: iframeOrUrl } = settings;

  const parameterValues = useSelector(getParameterValues);
  const iframe: string = useMemo(
    () =>
      fillParametersInText({
        dashcard,
        dashboard,
        parameterValues,
        text: prepareIFrameOrUrl(iframeOrUrl, width, height),
        escapeMarkdown: false,
      }),
    [dashcard, dashboard, parameterValues, iframeOrUrl, width, height],
  );

  const isNew = !!dashcard?.justAdded;

  const handleIFrameChange = useCallback(
    (newIFrame: string) => {
      onUpdateVisualizationSettings({ iframe: newIFrame });
    },
    [onUpdateVisualizationSettings],
  );

  if (isEditing && !isEditingParameter) {
    return (
      <IFrameEditWrapper>
        <StyledInput
          autoFocus={isNew}
          w="100%"
          minRows={gridSize.height}
          maxRows={gridSize.height}
          data-testid="iframe-card-input"
          value={iframeOrUrl ?? ""}
          placeholder={`<iframe src="https://example.com" />`}
          onChange={e => handleIFrameChange(e.target.value)}
          // prevents triggering drag events
          onMouseDown={e => e.stopPropagation()}
        />
      </IFrameEditWrapper>
    );
  }

  return (
    <IFrameWrapper
      data-testid="iframe-card"
      fade={isEditingParameter}
      dangerouslySetInnerHTML={{ __html: iframe }}
    ></IFrameWrapper>
  );
}

export const IFrameViz = Object.assign(IFrameVizInner, settings);
