import type React from "react";

import CS from "metabase/css/core/index.css";
import { Paper, type PaperProps, Stack } from "metabase/ui";

import { SidesheetCardTitle } from "./components/SidesheetCardTitle";

type SidesheetCardProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
} & PaperProps;

export const SidesheetCard = ({
  title,
  children,
  ...paperProps
}: SidesheetCardProps) => {
  return (
    <Paper p="lg" withBorder shadow="none" {...paperProps}>
      {title && <SidesheetCardTitle>{title}</SidesheetCardTitle>}
      <Stack spacing="md" className={CS.textMedium}>
        {children}
      </Stack>
    </Paper>
  );
};
