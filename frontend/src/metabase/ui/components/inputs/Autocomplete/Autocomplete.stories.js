import { Autocomplete, Stack } from "metabase/ui";

const dataWithGroupsLarge = [
  { value: "Entity key", icon: "label", group: "Overall row" },
  { value: "Entity name", icon: "string", group: "Overall row" },
  { value: "Foreign key", icon: "connections", group: "Overall row" },
  { value: "Category", icon: "string", group: "Common" },
  { value: "Comment", icon: "string", group: "Common" },
  { value: "Description", icon: "string", group: "Common" },
  { value: "Title", icon: "string", group: "Common" },
  { value: "City", icon: "location", group: "Location" },
  { value: "Country", icon: "location", group: "Location" },
  { value: "Latitude", icon: "location", group: "Location" },
  { value: "Longitude", icon: "location", group: "Location" },
  { value: "Longitude", icon: "location", group: "Location" },
  { value: "State", icon: "location", group: "Location" },
  { value: "Zip code", icon: "location", group: "Location" },
];

const dataWithGroups = dataWithGroupsLarge.slice(0, 6);

const dataWithIcons = dataWithGroups.map(item => ({
  ...item,
  group: undefined,
}));

const dataWithLabels = dataWithIcons.map(item => ({
  ...item,
  icon: undefined,
}));

const args = {
  data: dataWithLabels,
  size: "md",
  label: "Field type",
  description: undefined,
  error: undefined,
  placeholder: "No semantic type",
  limit: undefined,
  disabled: false,
  readOnly: false,
  withAsterisk: false,
  dropdownPosition: "flip",
};

const sampleArgs = {
  value: dataWithLabels[0].value,
  description: "Determines how Metabase displays the field",
  error: "required",
};

const argTypes = {
  data: {
    control: { type: "json" },
  },
  size: {
    options: ["xs", "md"],
    control: { type: "inline-radio" },
  },
  label: {
    control: { type: "text" },
  },
  description: {
    control: { type: "text" },
  },
  error: {
    control: { type: "text" },
  },
  placeholder: {
    control: { type: "text" },
  },
  limit: {
    control: { type: "number" },
  },
  disabled: {
    control: { type: "boolean" },
  },
  readOnly: {
    control: { type: "boolean" },
  },
  withAsterisk: {
    control: { type: "boolean" },
  },
  dropdownPosition: {
    options: ["bottom", "top", "flip"],
    control: { type: "inline-radio" },
  },
};

const DefaultTemplate = args => <Autocomplete {...args} />;

const VariantTemplate = args => (
  <Stack>
    <Autocomplete {...args} />
    <Autocomplete {...args} variant="unstyled" />
  </Stack>
);

const Default = DefaultTemplate.bind({});
const EmptyMd = VariantTemplate.bind({});
const AsteriskMd = VariantTemplate.bind({});
const DescriptionMd = VariantTemplate.bind({});
const DisabledMd = VariantTemplate.bind({});
const ErrorMd = VariantTemplate.bind({});
const ReadOnlyMd = VariantTemplate.bind({});
const IconsMd = VariantTemplate.bind({});
const GroupsMd = VariantTemplate.bind({});
const LargeSetsMd = VariantTemplate.bind({});
const EmptyXs = VariantTemplate.bind({});
const AsteriskXs = VariantTemplate.bind({});
const DescriptionXs = VariantTemplate.bind({});
const DisabledXs = VariantTemplate.bind({});
const ErrorXs = VariantTemplate.bind({});
const ReadOnlyXs = VariantTemplate.bind({});
const IconsXs = VariantTemplate.bind({});
const GroupsXs = VariantTemplate.bind({});
const LargeSetsXs = VariantTemplate.bind({});

export default {
  title: "Inputs/Autocomplete",
  component: Autocomplete,
  args,
  argTypes,
};

export const Default_ = {
  render: Default,
  name: "Default",
};

export const EmptyMd_ = {
  render: EmptyMd,
  name: "Empty, md",
};

export const AsteriskMd_ = {
  render: AsteriskMd,
  name: "Asterisk, md",
  args: {
    withAsterisk: true,
  },
};

export const DescriptionMd_ = {
  render: DescriptionMd,
  name: "Description, md",
  args: {
    description: sampleArgs.description,
    withAsterisk: true,
  },
};

export const DisabledMd_ = {
  render: DisabledMd,
  name: "Disabled, md",
  args: {
    description: sampleArgs.description,
    disabled: true,
    withAsterisk: true,
  },
};

export const ErrorMd_ = {
  render: ErrorMd,
  name: "Error, md",
  args: {
    description: sampleArgs.description,
    error: sampleArgs.error,
    withAsterisk: true,
  },
};

export const ReadOnlyMd_ = {
  render: ReadOnlyMd,
  name: "Read only, md",
  args: {
    defaultValue: sampleArgs.value,
    description: sampleArgs.description,
    readOnly: true,
    withAsterisk: true,
  },
};

export const IconsMd_ = {
  render: IconsMd,
  name: "Icons, md",
  args: {
    data: dataWithIcons,
    description: sampleArgs.description,
    withAsterisk: true,
  },
};

export const GroupsMd_ = {
  render: GroupsMd,
  name: "Groups, md",
  args: {
    data: dataWithGroups,
    description: sampleArgs.description,
    withAsterisk: true,
  },
};

export const LargeSetsMd_ = {
  render: LargeSetsMd,
  name: "Large sets, md",
  args: {
    data: dataWithGroupsLarge,
    description: sampleArgs.description,
    limit: 5,
    withAsterisk: true,
  },
};

export const EmptyXs_ = {
  render: EmptyXs,
  name: "Empty, xs",
  args: {
    ...EmptyMd.args,
    size: "xs",
  },
};

export const AsteriskXs_ = {
  render: AsteriskXs,
  name: "Asterisk, xs",
  args: {
    ...AsteriskMd.args,
    size: "xs",
  },
};

export const DescriptionXs_ = {
  render: DescriptionXs,
  name: "Description, xs",
  args: {
    ...DescriptionMd.args,
    size: "xs",
  },
};

export const DisabledXs_ = {
  render: DisabledXs,
  name: "Disabled, xs",
  args: {
    ...DisabledMd.args,
    size: "xs",
  },
};

export const ErrorXs_ = {
  render: ErrorXs,
  name: "Error, xs",
  args: {
    ...ErrorMd.args,
    size: "xs",
  },
};

export const ReadOnlyXs_ = {
  render: ReadOnlyXs,
  name: "Read only, xs",
  args: {
    ...ReadOnlyMd.args,
    size: "xs",
  },
};

export const IconsXs_ = {
  render: IconsXs,
  name: "Icons, xs",
  args: {
    ...IconsMd.args,
    size: "xs",
  },
};

export const GroupsXs_ = {
  render: GroupsXs,
  name: "Groups, xs",
  args: {
    ...GroupsMd.args,
    size: "xs",
  },
};

export const LargeSetsXs_ = {
  render: LargeSetsXs,
  name: "Large sets, xs",
  args: {
    ...LargeSetsMd.args,
    size: "xs",
  },
};
