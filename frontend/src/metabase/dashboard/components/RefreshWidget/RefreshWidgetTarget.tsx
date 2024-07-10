import { t } from "ttag";

import { CountdownIcon } from "metabase/components/icons/CountdownIcon";
import { isNotNull } from "metabase/lib/types";

import { DashboardHeaderButton } from "../DashboardHeader/buttons/DashboardHeaderButton";

export const RefreshWidgetTarget = ({
  period,
  elapsed,
}: {
  elapsed: number | null;
  period: number | null;
}) => {
  const showRemaining = isNotNull(elapsed) && isNotNull(period);

  if (!showRemaining) {
    return (
      <DashboardHeaderButton
        tooltipLabel={t`Auto-refresh`}
        icon="clock"
        aria-label={t`Auto Refresh`}
      />
    );
  }

  const remaining = period - elapsed;

  return (
    <DashboardHeaderButton
      tooltipLabel={
        t`Refreshing in` +
        " " +
        Math.floor(remaining / 60) +
        ":" +
        (remaining % 60 < 10 ? "0" : "") +
        Math.round(remaining % 60)
      }
      name="clock"
      aria-label={t`Auto Refresh`}
    >
      <CountdownIcon
        width={16}
        height={16}
        percent={Math.min(0.95, remaining / period)}
      />
    </DashboardHeaderButton>
  );
};
