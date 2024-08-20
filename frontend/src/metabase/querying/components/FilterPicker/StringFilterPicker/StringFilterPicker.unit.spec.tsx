import userEvent from "@testing-library/user-event";

import {
  setupFieldSearchValuesEndpoint,
  setupFieldsValuesEndpoints,
} from "__support__/server-mocks";
import {
  renderWithProviders,
  screen,
  waitForLoaderToBeRemoved,
  within,
} from "__support__/ui";
import { checkNotNull } from "metabase/lib/types";
import * as Lib from "metabase-lib";
import {
  PEOPLE,
  PRODUCT_CATEGORY_VALUES,
  PRODUCT_VENDOR_VALUES,
} from "metabase-types/api/mocks/presets";

import {
  createQuery,
  createQueryWithStringFilter,
  findStringColumn,
  storeInitialState,
} from "../test-utils";

import { StringFilterPicker } from "./StringFilterPicker";

type SetupOpts = {
  query?: Lib.Query;
  column?: Lib.ColumnMetadata;
  filter?: Lib.FilterClause;
};

const EXPECTED_OPERATORS = [
  "Is",
  "Is not",
  "Contains",
  "Does not contain",
  "Starts with",
  "Ends with",
  "Is empty",
  "Not empty",
];

function setup({
  query = createQuery(),
  column = findStringColumn(query),
  filter,
}: SetupOpts = {}) {
  const onChange = jest.fn();
  const onBack = jest.fn();

  setupFieldsValuesEndpoints([PRODUCT_CATEGORY_VALUES, PRODUCT_VENDOR_VALUES]);

  renderWithProviders(
    <StringFilterPicker
      query={query}
      stageIndex={0}
      column={column}
      filter={filter}
      isNew={!filter}
      onChange={onChange}
      onBack={onBack}
    />,
    { storeInitialState },
  );

  function getNextFilterParts() {
    const [filter] = onChange.mock.lastCall;
    return Lib.stringFilterParts(query, 0, filter);
  }

  function getNextFilterColumnName() {
    const parts = getNextFilterParts();
    const column = checkNotNull(parts?.column);
    return Lib.displayInfo(query, 0, column).longDisplayName;
  }

  return {
    query,
    column,
    getNextFilterParts,
    getNextFilterColumnName,
    onChange,
    onBack,
  };
}

async function setOperator(operator: string) {
  await userEvent.click(screen.getByLabelText("Filter operator"));
  await userEvent.click(await screen.findByText(operator));
}

describe("StringFilterPicker", () => {
  describe("new filter", () => {
    it("should render a blank editor", () => {
      setup();

      expect(screen.getByText("Product → Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Contains")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter some text")).toHaveValue("");
      expect(screen.getByRole("button", { name: "Add filter" })).toBeDisabled();
    });

    it("should list operators", async () => {
      setup();

      await userEvent.click(screen.getByLabelText("Filter operator"));
      const listbox = await screen.findByRole("listbox");
      const options = within(listbox).getAllByRole("option");

      expect(options).toHaveLength(EXPECTED_OPERATORS.length);
      EXPECTED_OPERATORS.forEach(operatorName =>
        expect(within(listbox).getByText(operatorName)).toBeInTheDocument(),
      );
    });

    it("should handle fields with listable values", async () => {
      const query = createQuery();
      const column = findStringColumn(query, "PRODUCTS", "CATEGORY");
      const { getNextFilterParts, getNextFilterColumnName } = setup({
        query,
        column,
      });
      await waitForLoaderToBeRemoved();

      expect(screen.getByText("Doohickey")).toBeInTheDocument();
      expect(screen.getByText("Gadget")).toBeInTheDocument();
      expect(screen.getByText("Gizmo")).toBeInTheDocument();
      expect(screen.getByText("Widget")).toBeInTheDocument();

      await userEvent.type(screen.getByPlaceholderText("Search the list"), "G");

      expect(screen.queryByText("Doohickey")).not.toBeInTheDocument();
      await userEvent.click(screen.getByText("Gadget"));
      await userEvent.click(screen.getByText("Widget"));
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "=",
        column: expect.anything(),
        values: ["Gadget", "Widget"],
      });
      expect(getNextFilterColumnName()).toBe("Product → Category");
    });

    it("should handle fields with searchable values", async () => {
      setupFieldSearchValuesEndpoint(PEOPLE.EMAIL, PEOPLE.EMAIL, "t", [
        ["test@metabase.test"],
      ]);
      const query = createQuery();
      const column = findStringColumn(query, "PEOPLE", "EMAIL");
      const { getNextFilterParts, getNextFilterColumnName } = setup({
        query,
        column,
      });
      await waitForLoaderToBeRemoved();

      await userEvent.click(screen.getByDisplayValue("Contains"));
      await userEvent.click(screen.getByText("Is"));
      await userEvent.type(screen.getByPlaceholderText("Search by Email"), "t");
      await userEvent.click(await screen.findByText("test@metabase.test"));

      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "=",
        column: expect.anything(),
        values: ["test@metabase.test"],
      });
      expect(getNextFilterColumnName()).toBe("User → Email");
    });

    it("should add a filter with one value", async () => {
      const { getNextFilterParts, getNextFilterColumnName } = setup();

      await setOperator("Contains");
      await userEvent.type(
        screen.getByPlaceholderText("Enter some text"),
        "green",
      );
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "contains",
        column: expect.anything(),
        values: ["green"],
        options: { "case-sensitive": false },
      });
      expect(getNextFilterColumnName()).toBe("Product → Description");
    });

    it("should add a case-sensitive filter", async () => {
      const { getNextFilterParts, getNextFilterColumnName } = setup();

      await setOperator("Does not contain");
      await userEvent.type(
        screen.getByPlaceholderText("Enter some text"),
        "Ga",
      );
      await userEvent.click(screen.getByLabelText("Case sensitive"));
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "does-not-contain",
        column: expect.anything(),
        values: ["Ga"],
        options: { "case-sensitive": true },
      });
      expect(getNextFilterColumnName()).toBe("Product → Description");
    });

    it("should add a filter with multiple values", async () => {
      const query = createQuery();
      const column = findStringColumn(query, "PRODUCTS", "CATEGORY");
      const { getNextFilterParts, getNextFilterColumnName } = setup({
        query,
        column,
      });
      await waitForLoaderToBeRemoved();

      await userEvent.click(screen.getByLabelText("Doohickey"));
      await userEvent.click(screen.getByLabelText("Widget"));
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "=",
        column: expect.anything(),
        values: ["Doohickey", "Widget"],
        options: {},
      });
      expect(getNextFilterColumnName()).toBe("Product → Category");
    });

    it("should add a filter with multiple values via keyboard", async () => {
      const query = createQuery();
      const column = findStringColumn(query, "PRODUCTS", "CATEGORY");
      const { onChange, getNextFilterParts, getNextFilterColumnName } = setup({
        query,
        column,
      });
      await waitForLoaderToBeRemoved();

      const input = screen.getByPlaceholderText("Search the list");
      await userEvent.type(input, "{enter}");
      expect(onChange).not.toHaveBeenCalled();

      await userEvent.click(screen.getByLabelText("Doohickey"));
      await userEvent.click(screen.getByLabelText("Widget"));
      await userEvent.type(input, "{enter}");
      expect(onChange).toHaveBeenCalled();
      expect(getNextFilterParts()).toMatchObject({
        operator: "=",
        column: expect.anything(),
        values: ["Doohickey", "Widget"],
        options: {},
      });
      expect(getNextFilterColumnName()).toBe("Product → Category");
    });

    it("should add a filter with no value", async () => {
      const { getNextFilterParts, getNextFilterColumnName } = await setup();

      await setOperator("Is empty");
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "is-empty",
        column: expect.anything(),
        values: [],
        options: {},
      });
      expect(getNextFilterColumnName()).toBe("Product → Description");
    });

    it("should coerce numeric values to strings", async () => {
      const { getNextFilterParts } = setup();

      await setOperator("Starts with");
      await userEvent.type(
        screen.getByPlaceholderText("Enter some text"),
        "123",
      );
      await userEvent.click(screen.getByText("Add filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "starts-with",
        column: expect.anything(),
        values: ["123"],
        options: { "case-sensitive": false },
      });
    });

    it("should not accept an empty string as a value", async () => {
      setup();

      await setOperator("Contains");
      const input = screen.getByPlaceholderText("Enter some text");
      await userEvent.type(input, "Ga");
      await userEvent.clear(input);

      expect(screen.getByRole("button", { name: "Add filter" })).toBeDisabled();
    });

    it("should handle options when changing an operator", async () => {
      setup();

      await setOperator("Contains");
      expect(screen.getByLabelText("Case sensitive")).not.toBeChecked();

      await setOperator("Does not contain");
      expect(screen.getByLabelText("Case sensitive")).not.toBeChecked();

      await userEvent.click(screen.getByLabelText("Case sensitive"));
      await setOperator("Starts with");
      expect(screen.getByLabelText("Case sensitive")).toBeChecked();

      await setOperator("Ends with");
      expect(screen.getByLabelText("Case sensitive")).toBeChecked();

      await setOperator("Is empty");
      await setOperator("Contains");
      expect(screen.getByLabelText("Case sensitive")).toBeChecked();
    });

    it("should go back", async () => {
      const { onBack, onChange } = setup();
      await userEvent.click(screen.getByLabelText("Back"));
      expect(onBack).toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("existing filter", () => {
    describe("with one value", () => {
      const opts = createQueryWithStringFilter({
        operator: "contains",
        values: ["abc"],
        options: { "case-sensitive": false },
      });

      it("should render a filter", () => {
        setup(opts);

        expect(screen.getByText("Product → Description")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Contains")).toBeInTheDocument();
        expect(screen.getByDisplayValue("abc")).toBeInTheDocument();
        expect(screen.getByLabelText("Case sensitive")).not.toBeChecked();
        expect(
          screen.getByRole("button", { name: "Update filter" }),
        ).toBeEnabled();
      });

      it("should update a filter", async () => {
        const { getNextFilterParts, getNextFilterColumnName } = setup(opts);

        const input = screen.getByLabelText("Filter value");
        expect(screen.getByDisplayValue("abc")).toBeInTheDocument();
        await userEvent.type(input, "{backspace}");
        expect(screen.queryByDisplayValue("abc")).not.toBeInTheDocument();

        await userEvent.type(input, "foo");
        await userEvent.click(screen.getByLabelText("Case sensitive"));
        await userEvent.click(screen.getByText("Update filter"));

        const filterParts = getNextFilterParts();
        expect(filterParts).toMatchObject({
          operator: "contains",
          column: expect.anything(),
          values: ["foo"],
          options: { "case-sensitive": true },
        });
        expect(getNextFilterColumnName()).toBe("Product → Description");
      });
    });

    describe("with many values", () => {
      const query = createQuery();
      const opts = createQueryWithStringFilter({
        query,
        operator: "=",
        column: findStringColumn(query, "PRODUCTS", "CATEGORY"),
        values: ["Gadget", "Gizmo"],
      });

      it("should render a filter", async () => {
        setup(opts);
        await waitForLoaderToBeRemoved();

        expect(screen.getByText("Product → Category")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Is")).toBeInTheDocument();
        expect(screen.getByLabelText("Gadget")).toBeChecked();
        expect(screen.getByLabelText("Gizmo")).toBeChecked();
        expect(
          screen.getByRole("button", { name: "Update filter" }),
        ).toBeEnabled();
      });

      it("should update a filter", async () => {
        const { getNextFilterParts, getNextFilterColumnName } = setup(opts);
        await waitForLoaderToBeRemoved();

        await userEvent.click(screen.getByLabelText("Gadget"));
        await userEvent.click(screen.getByLabelText("Widget"));
        await userEvent.click(screen.getByText("Update filter"));

        const filterParts = getNextFilterParts();
        expect(filterParts).toMatchObject({
          operator: "=",
          column: expect.anything(),
          values: ["Gizmo", "Widget"],
          options: {},
        });
        expect(getNextFilterColumnName()).toBe("Product → Category");
      });
    });

    describe("without a value", () => {
      const opts = createQueryWithStringFilter({
        operator: "is-empty",
        values: [],
      });

      it("should render a filter", () => {
        setup(opts);

        expect(screen.getByText("Product → Description")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Is empty")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Update filter" }),
        ).toBeEnabled();
      });

      it("should update a filter", async () => {
        const { getNextFilterParts, getNextFilterColumnName } = setup(opts);

        await setOperator("Not empty");
        await userEvent.click(screen.getByText("Update filter"));

        const filterParts = getNextFilterParts();
        expect(filterParts).toMatchObject({
          operator: "not-empty",
          column: expect.anything(),
          values: [],
          options: {},
        });
        expect(getNextFilterColumnName()).toBe("Product → Description");
      });
    });

    it("should list operators", async () => {
      setup(createQueryWithStringFilter());

      await userEvent.click(screen.getByLabelText("Filter operator"));
      const listbox = await screen.findByRole("listbox");
      const options = within(listbox).getAllByRole("option");

      expect(options).toHaveLength(EXPECTED_OPERATORS.length);
      EXPECTED_OPERATORS.forEach(operatorName =>
        expect(within(listbox).getByText(operatorName)).toBeInTheDocument(),
      );
    });

    it("should change an operator", async () => {
      const { getNextFilterParts, getNextFilterColumnName } = setup(
        createQueryWithStringFilter({ operator: "=", values: ["foo"] }),
      );

      await setOperator("Contains");
      await userEvent.click(screen.getByText("Update filter"));

      const filterParts = getNextFilterParts();
      expect(filterParts).toMatchObject({
        operator: "contains",
        column: expect.anything(),
        values: ["foo"],
      });
      expect(getNextFilterColumnName()).toBe("Product → Description");
    });

    it("should re-use values when changing an operator", async () => {
      const query = createQuery();
      setup(
        createQueryWithStringFilter({
          query,
          operator: "=",
          values: ["Gadget", "Gizmo"],
          column: findStringColumn(query, "PRODUCTS", "CATEGORY"),
        }),
      );
      await waitForLoaderToBeRemoved();
      const updateButton = screen.getByRole("button", {
        name: "Update filter",
      });

      expect(screen.getByLabelText("Gadget")).toBeChecked();
      expect(screen.getByLabelText("Gizmo")).toBeChecked();

      await setOperator("Is not");

      expect(screen.getByLabelText("Gadget")).toBeChecked();
      expect(screen.getByLabelText("Gizmo")).toBeChecked();
      expect(updateButton).toBeEnabled();

      await setOperator("Contains");

      expect(screen.getByDisplayValue("Gadget,Gizmo")).toBeInTheDocument();
      expect(updateButton).toBeEnabled();

      await setOperator("Is empty");

      expect(screen.queryByText("Gadget")).not.toBeInTheDocument();
      expect(screen.queryByText("Gizmo")).not.toBeInTheDocument();
      expect(updateButton).toBeEnabled();

      await setOperator("Is");

      expect(await screen.findByLabelText("Gadget")).not.toBeChecked();
      expect(screen.getByLabelText("Gizmo")).not.toBeChecked();
      expect(updateButton).toBeDisabled();
    });

    it("should go back", async () => {
      const { onBack, onChange } = setup(createQueryWithStringFilter());
      await userEvent.click(screen.getByLabelText("Back"));
      expect(onBack).toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
