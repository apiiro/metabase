import type { MultiSelectProps, SelectItem } from "@mantine/core";
import { MultiSelect, Tooltip } from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import type { ClipboardEvent, FocusEvent } from "react";
import { useMemo, useState } from "react";
import { t } from "ttag";

import { Icon } from "metabase/ui";

import { parseValues, cleanValue } from "./util";

export type MultiAutocompleteProps = Omit<MultiSelectProps, "shouldCreate"> & {
  shouldCreate?: (query: string, selectedValues: string[]) => boolean;
};

export function MultiAutocomplete({
  data,
  value: controlledValue,
  defaultValue,
  searchValue: controlledSearchValue,
  placeholder,
  autoFocus,
  shouldCreate = defaultShouldCreate,
  onChange,
  onSearchChange,
  onFocus,
  onBlur,
  ...props
}: MultiAutocompleteProps) {
  const [selectedValues, setSelectedValues] = useUncontrolled({
    value: controlledValue,
    defaultValue,
    finalValue: [],
    onChange,
  });
  const [searchValue, setSearchValue] = useUncontrolled({
    value: controlledSearchValue,
    finalValue: "",
    onChange: onSearchChange,
  });
  const [lastSelectedValues, setLastSelectedValues] = useState(selectedValues);
  const [isFocused, setIsFocused] = useState(false);
  const visibleValues = isFocused ? lastSelectedValues : selectedValues;

  const items = useMemo(
    () => getAvailableSelectItems(data, lastSelectedValues),
    [data, lastSelectedValues],
  );

  const handleChange = (newValues: string[]) => {
    setSelectedValues(newValues);
    setLastSelectedValues(newValues);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setLastSelectedValues(selectedValues);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setLastSelectedValues(selectedValues);
    setSearchValue("");
    onBlur?.(event);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const before = value.slice(0, input.selectionStart ?? value.length);
    const after = value.slice(input.selectionEnd ?? value.length);

    const pasted = event.clipboardData.getData("text");
    const text = `${before}${pasted}${after}`;
    const values = parseValues(text);
    const validValues = values
      .map(cleanValue)
      .filter(value => shouldCreate?.(value, selectedValues));

    event.preventDefault();

    if (validValues.length > 0) {
      const newSelectedValues = [...lastSelectedValues, ...validValues];
      setSelectedValues(newSelectedValues);
      setLastSelectedValues(newSelectedValues);
      setSearchValue("");
    }
  };

  const handleSearchChange = (newSearchValue: string) => {
    const values = parseValues(newSearchValue);
    const validValues = values
      .map(cleanValue)
      .filter(value => shouldCreate?.(value, lastSelectedValues));

    const last = values.at(-1);

    if (last === "") {
      setSearchValue("");
      const newSelectedValues = [...lastSelectedValues, ...validValues];
      setSelectedValues(newSelectedValues);
      setLastSelectedValues(newSelectedValues);
    } else {
      setSearchValue(last ?? "");
      setSelectedValues([...lastSelectedValues, ...validValues]);
      setLastSelectedValues([
        ...lastSelectedValues,
        ...validValues.slice(0, -1),
      ]);
    }
  };

  const info = (
    <Tooltip
      label={t`Separate values with commas or newlines. Use double quotes for values containing commas.`}
    >
      <Icon name="info_filled" color="red" />
    </Tooltip>
  );

  return (
    <MultiSelect
      {...props}
      data={items}
      value={visibleValues}
      searchValue={searchValue}
      placeholder={placeholder}
      searchable
      autoFocus={autoFocus}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onSearchChange={handleSearchChange}
      onPaste={handlePaste}
      rightSection={info}
    />
  );
}

function getSelectItem(item: string | SelectItem): SelectItem {
  if (typeof item === "string") {
    return { value: item, label: item };
  }

  if (!item.label) {
    return { value: item.value, label: item.value };
  }

  return item;
}

function getAvailableSelectItems(
  data: ReadonlyArray<string | SelectItem>,
  selectedValues: string[],
) {
  const all = [...data, ...selectedValues].map(getSelectItem);
  const seen = new Set();

  // Deduplicate items based on value
  return all.filter(function (option) {
    if (seen.has(option.value)) {
      return false;
    }
    seen.add(option.value);
    return true;
  });
}

function defaultShouldCreate(query: string, selectedValues: string[]) {
  return (
    query.trim().length > 0 && !selectedValues.some(value => value === query)
  );
}
