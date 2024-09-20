import styled from "@emotion/styled";

import { Textarea } from "metabase/ui";

export const IFrameWrapper = styled.div<{ fade?: boolean }>`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  pointer-events: ${({ fade }) => (fade ? "none" : "all")};
  opacity: ${({ fade }) => (fade ? 0.25 : 1)};
`;

export const IFrameEditWrapper = styled.div<{ fade?: boolean }>`
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: ${({ fade }) => (fade ? "none" : "all")};
  opacity: ${({ fade }) => (fade ? 0.25 : 1)};
`;

export const StyledInput = styled(Textarea)`
  pointer-events: all;

  * {
    pointer-events: all;
  }
`;
