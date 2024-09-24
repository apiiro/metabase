import { Sidesheet } from "metabase/common/components/Sidesheet";
import type { Collection } from "metabase-types/api";

export const CollectionSidesheet = ({
  isOpen,
  onClose,
  collection,
}: {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
}) => {
  return (
    <Sidesheet onClose={onClose} isOpen={isOpen}>
      {collection.name}
    </Sidesheet>
  );
};
