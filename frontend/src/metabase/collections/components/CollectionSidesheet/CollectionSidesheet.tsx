import { useState } from "react";
import { useMount } from "react-use";
import { t } from "ttag";

import { Sidesheet } from "metabase/common/components/Sidesheet";
import { EntityIdCard } from "metabase/components/EntityIdCard";
import { Stack } from "metabase/ui";
import type { Collection } from "metabase-types/api";

export const CollectionSidesheet = ({
  onClose,
  collection,
}: {
  onClose: () => void;
  collection: Collection;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useMount(() => {
    // this component is not rendered until it is "open"
    // but we want to set isOpen after it mounts to get
    // pretty animations
    setIsOpen(true);
  });

  return (
    <Sidesheet
      title={t`Info`}
      isOpen={isOpen}
      data-testid="collection-sidesheet"
      size="md"
      onClose={onClose}
    >
      <Stack spacing="lg">
        {collection.entity_id && (
          <EntityIdCard entityId={collection.entity_id} />
        )}
      </Stack>
    </Sidesheet>
  );
};
