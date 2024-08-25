import { SAMPLE_DB_ID } from "e2e/support/cypress_data";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import {
  assertEChartsTooltip,
  chartPathWithFillColor,
  echartsContainer,
  getDraggableElements,
  getNotebookStep,
  leftSidebar,
  moveDnDKitElement,
  openNotebook,
  pieSlices,
  popover,
  restore,
  tableHeaderClick,
  visitQuestionAdhoc,
  visualize,
} from "e2e/support/helpers";

const { PRODUCTS, PRODUCTS_ID, ORDERS_ID, ORDERS, PEOPLE } = SAMPLE_DATABASE;

const testQuery = {
  type: "query",
  query: {
    "source-table": PRODUCTS_ID,
    aggregation: [["count"]],
    breakout: [["field", PRODUCTS.CATEGORY, null]],
  },
  database: SAMPLE_DB_ID,
};

const twoRingQuery = {
  database: 1,
  type: "query",
  query: {
    "source-table": ORDERS_ID,
    aggregation: [["count"]],
    breakout: [
      [
        "field",
        ORDERS.CREATED_AT,
        { "base-type": "type/DateTime", "temporal-unit": "day-of-week" },
      ],
      [
        "field",
        PRODUCTS.CATEGORY,
        { "base-type": "type/Text", "source-field": ORDERS.PRODUCT_ID },
      ],
    ],
  },
};

const threeRingQuery = {
  database: 1,
  type: "query",
  query: {
    "source-table": ORDERS_ID,
    aggregation: [["count"]],
    breakout: [
      [
        "field",
        ORDERS.CREATED_AT,
        { "base-type": "type/DateTime", "temporal-unit": "year" },
      ],
      [
        "field",
        PEOPLE.SOURCE,
        { "base-type": "type/Text", "source-field": ORDERS.USER_ID },
      ],
      [
        "field",
        PRODUCTS.CATEGORY,
        { "base-type": "type/Text", "source-field": ORDERS.PRODUCT_ID },
      ],
    ],
  },
};

describe("scenarios > visualizations > pie chart", () => {
  beforeEach(() => {
    restore();
    cy.signInAsNormalUser();
  });

  it("should render a pie chart (metabase#12506) (#35244)", () => {
    visitQuestionAdhoc({
      dataset_query: testQuery,
      display: "pie",
    });

    ensurePieChartRendered(
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
      null,
      null,
      200,
    );

    cy.log("#35244");
    cy.findByLabelText("Switch to data").click();
    tableHeaderClick("Count");
    popover().within(() => {
      cy.findByRole("img", { name: /filter/ }).should("exist");
      cy.findByRole("img", { name: /gear/ }).should("not.exist");
      cy.findByRole("img", { name: /eye_crossed_out/ }).should("not.exist");
    });
  });

  it("should mute items in legend when hovering (metabase#29224)", () => {
    visitQuestionAdhoc({
      dataset_query: testQuery,
      display: "pie",
    });

    cy.findByTestId("chart-legend").findByText("Doohickey").realHover();
    [
      ["Doohickey", "true"],
      ["Gadget", "false"],
      ["Gizmo", "false"],
      ["Widget", "false"],
    ].map(args => checkLegendItemAriaCurrent(args[0], args[1]));
  });

  it("should instantly toggle the total after changing the setting", () => {
    visitQuestionAdhoc({
      dataset_query: testQuery,
      display: "pie",
    });

    cy.findByTestId("viz-settings-button").click();

    leftSidebar().within(() => {
      cy.findByText("Display").click();
      cy.findByText("Show total").click();
    });

    cy.findByTestId("query-visualization-root").within(() => {
      cy.findByText("TOTAL").should("not.exist");
    });

    leftSidebar().within(() => {
      cy.findByText("Show total").click();
    });

    cy.findByTestId("query-visualization-root").within(() => {
      cy.findByText("TOTAL").should("be.visible");
    });
  });

  // Skipping since the mousemove trigger flakes too often, and there's already a loki
  // test to cover truncation
  it.skip("should truncate the center dimension label if it overflows", () => {
    visitQuestionAdhoc({
      dataset_query: {
        type: "query",
        query: {
          "source-table": PRODUCTS_ID,
          expressions: {
            category_foo: [
              "concat",
              ["field", PRODUCTS.CATEGORY, null],
              " the quick brown fox jumps over the lazy dog",
            ],
          },
          aggregation: [["count"]],
          breakout: [["expression", "category_foo"]],
        },
        database: SAMPLE_DB_ID,
      },
      display: "pie",
    });

    chartPathWithFillColor("#A989C5").as("slice");
    cy.get("@slice").trigger("mousemove");

    cy.findByTestId("query-visualization-root")
      .findByText("WIDGET THE QUICK BROWN FOX JUMP…")
      .should("be.visible");
  });

  it("should add new slices to the chart if they appear in the query result", () => {
    visitQuestionAdhoc({
      dataset_query: getLimitedQuery(testQuery, 2),
      display: "pie",
    });

    ensurePieChartRendered(["Gadget", "Doohickey"]);

    changeRowLimit(2, 4);

    ensurePieChartRendered(["Widget", "Gadget", "Gizmo", "Doohickey"]);
  });

  it("should preserve a slice's settings if its row is removed then reappears in the query result", () => {
    visitQuestionAdhoc({
      dataset_query: getLimitedQuery(testQuery, 4),
      display: "pie",
    });

    ensurePieChartRendered(["Widget", "Gadget", "Gizmo", "Doohickey"]);

    cy.findByTestId("viz-settings-button").click();

    // Open color picker
    cy.findByLabelText("#F2A86F").click();

    popover().within(() => {
      // Change color
      cy.findByLabelText("#509EE3").click();
    });

    cy.findByTestId("Widget-settings-button").click();

    cy.findByDisplayValue("Widget").type("{selectall}Woooget").realPress("Tab");

    moveDnDKitElement(getDraggableElements().contains("Woooget"), {
      vertical: 100,
    });

    ensurePieChartRendered(["Woooget", "Gadget", "Gizmo", "Doohickey"]);
    chartPathWithFillColor("#509EE3").should("be.visible");

    cy.findByTestId("chart-legend").within(() => {
      cy.get("li").eq(2).contains("Woooget");
    });

    changeRowLimit(4, 2);
    ensurePieChartRendered(["Gadget", "Doohickey"]);

    // Ensure row settings should show only two rows
    cy.findByTestId("viz-settings-button").click();
    getDraggableElements().should("have.length", 2);
    getDraggableElements().contains("Woooget").should("not.exist");
    getDraggableElements().contains("Gizmo").should("not.exist");

    cy.findByTestId("Gadget-settings-button").click();
    cy.findByDisplayValue("Gadget").type("{selectall}Katget").realPress("Tab");
    moveDnDKitElement(getDraggableElements().contains("Katget"), {
      vertical: 30,
    });

    changeRowLimit(2, 4);
    ensurePieChartRendered(["Doohickey", "Katget", "Gizmo", "Woooget"]);
    chartPathWithFillColor("#509EE3").should("be.visible");

    cy.findByTestId("chart-legend").within(() => {
      cy.get("li").eq(1).contains("Katget");
      cy.get("li").eq(3).contains("Woooget");
    });
  });

  it("should automatically map dimension columns in query to rings", () => {
    visitQuestionAdhoc({
      dataset_query: twoRingQuery,
      display: "pie",
    });

    ensurePieChartRendered(
      [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
    );
  });

  it("should allow the user to edit rings", () => {
    visitQuestionAdhoc({
      dataset_query: threeRingQuery,
      display: "pie",
      visualization_settings: {
        "pie.slice_threshold": 0,
      },
    });

    ensurePieChartRendered(
      ["2022", "2023", "2024", "2025", "2026"],
      ["Affiliate", "Facebook", "Google", "Organic", "Twitter"],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
    );

    cy.findByTestId("viz-settings-button").click();

    cy.findAllByTestId("chartsettings-field-picker")
      .last()
      .within(() => {
        cy.icon("close").click();
      });

    ensurePieChartRendered(
      ["2022", "2023", "2024", "2025", "2026"],
      ["Affiliate", "Facebook", "Google", "Organic", "Twitter"],
    );

    cy.findAllByTestId("chartsettings-field-picker")
      .last()
      .within(() => {
        cy.icon("chevrondown").click();
      });

    cy.get("[data-element-id=list-section]").last().click();

    ensurePieChartRendered(
      ["2022", "2023", "2024", "2025", "2026"],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
    );

    leftSidebar().within(() => {
      cy.findByText("Add Ring").click();
    });

    cy.get("[data-element-id=list-section]").last().click();

    ensurePieChartRendered(
      ["2022", "2023", "2024", "2025", "2026"],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
      ["Affiliate", "Facebook", "Google", "Organic", "Twitter"],
    );
  });

  it("should handle hover and click actions correctly", () => {
    visitQuestionAdhoc({
      dataset_query: twoRingQuery,
      display: "pie",
      visualization_settings: {
        "pie.slice_threshold": 0,
      },
    });

    ensurePieChartRendered(
      [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
    );

    echartsContainer().within(() => {
      cy.findByText("Saturday").as("saturdaySlice").trigger("mousemove");
    });

    assertEChartsTooltip({
      header: "Created At",
      rows: [
        {
          color: "#51528D",
          name: "Saturday",
          value: "2,747",
        },
        {
          color: "#ED8535",
          name: "Thursday",
          value: "2,698",
        },
        {
          color: "#E75454",
          name: "Tuesday",
          value: "2,695",
        },
        {
          color: "#689636",
          name: "Sunday",
          value: "2,671",
        },
        {
          color: "#8A5EB0",
          name: "Monday",
          value: "2,664",
        },
        {
          color: "#69C8C8",
          name: "Friday",
          value: "2,662",
        },
        {
          color: "#F7C41F",
          name: "Wednesday",
          value: "2,623",
        },
      ],
    });

    cy.get("@saturdaySlice").click({ force: true });

    popover().within(() => {
      cy.findByText("=").click();
    });

    cy.findByTestId("qb-filters-panel").within(() => {
      cy.findByText("Count is equal to 2747").should("be.visible");
    });

    cy.go("back");

    ensurePieChartRendered(
      [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      ["Doohickey", "Gadget", "Gizmo", "Widget"],
    );

    echartsContainer().within(() => {
      cy.findAllByText("Doohickey")
        .first()
        .as("doohickeySlice")
        .trigger("mousemove");
    });

    assertEChartsTooltip({
      header: "Saturday",
      rows: [
        {
          color: "#7172AD",
          name: "Doohickey",
          value: "606",
        },
        {
          color: "#7172AD",
          name: "Gadget",
          value: "740",
        },
        {
          color: "#7172AD",
          name: "Gizmo",
          value: "640",
        },
        {
          color: "#7172AD",
          name: "Widget",
          value: "761",
        },
      ],
    });

    cy.get("@doohickeySlice").click({ force: true });

    popover().within(() => {
      cy.findByText("=").click();
    });

    cy.findByTestId("qb-filters-panel").within(() => {
      cy.findByText("Count is equal to 606").should("be.visible");
    });
  });
});

function ensurePieChartRendered(rows, middleRows, outerRows, totalValue) {
  cy.findByTestId("query-visualization-root").within(() => {
    // detail
    if (totalValue != null) {
      cy.findByText("TOTAL").should("be.visible");
      cy.findByText(totalValue).should("be.visible");
    }

    // slices
    let rowCount = rows.length;
    const hasMiddleRows = middleRows != null && middleRows.length > 0;
    const hasOuterRows = outerRows != null && outerRows.length > 0;

    if (hasMiddleRows) {
      rowCount += rows.length * middleRows.length;
    }
    if (hasMiddleRows && hasOuterRows) {
      rowCount += rows.length * middleRows.length * outerRows.length;
    }
    pieSlices().should("have.length", rowCount);

    // legend
    rows.forEach((name, i) => {
      cy.findAllByTestId("legend-item").contains(name).should("be.visible");
    });
  });
}

function checkLegendItemAriaCurrent(title, value) {
  cy.findByTestId("chart-legend")
    .findByTestId(`legend-item-${title}`)
    .should("have.attr", "aria-current", value);
}

function getLimitedQuery(query, limit) {
  return {
    ...query,
    query: {
      ...query.query,
      limit,
    },
  };
}

function changeRowLimit(from, to) {
  openNotebook();
  getNotebookStep("limit").within(() => {
    cy.findByDisplayValue(String(from))
      .type(`{selectall}${String(to)}`)
      .realPress("Tab");
  });

  visualize();
}
