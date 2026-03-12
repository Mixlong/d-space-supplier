<template>
  <div class="app-container assessment-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="年份">
        <el-date-picker
          v-model="queryParams.year"
          type="year"
          value-format="YYYY"
          placeholder="请选择年份"
          style="width: 180px"
          clearable
        />
      </el-form-item>
      <template #extra-actions>
        <a
          v-if="qualityAgreementUrl"
          class="quality-agreement-link quality-agreement-link--right"
          :href="getAttachmentHref(qualityAgreementUrl)"
          target="_blank"
          rel="noreferrer"
        >
          查看质量协议
        </a>
      </template>
    </search-bar>

    <div
      class="assessment-excel-page"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <div
        v-if="isMatched"
        ref="excelTableWrapRef"
        class="excel-table-wrap"
        :class="{
          'is-space-pan': spacePressed,
          'is-dragging': isDragging,
        }"
        @mousedown="handleTableMouseDown"
      >
        <table class="excel-table">
          <colgroup>
            <col
              v-for="col in visibleColumns"
              :key="`col-${col.index}`"
              :style="{ width: `${col.width}px` }"
            />
          </colgroup>
          <tbody>
            <tr v-for="(row, rowIndex) in displayRows" :key="`r-${rowIndex}`">
              <td
                v-for="cell in row"
                :key="`c-${rowIndex}-${cell.col}`"
                :rowspan="cell.rowspan"
                :colspan="cell.colspan"
                :class="cell.className"
              >
                <div
                  v-if="isJudgementSummaryCell(rowIndex, cell.col)"
                  class="cell-content judgement-summary-content"
                >
                  <template v-if="hasJudgementSummaryValue(cell.value)">
                    <div class="judgement-q">
                      {{ getJudgementQuarterText(cell.value, cell.col) }}
                    </div>
                    <div class="judgement-score">
                      {{ getJudgementScoreText(cell.value) }}
                    </div>
                  </template>
                </div>
                <div v-else class="cell-content">{{ cell.value }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-wrap">
        <el-empty
          :description="
            hasSearched ? '未找到匹配的考核数据' : '请选择年份后点击查询'
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getVendorAssessmentYearly } from "@/api/vendor-assessment";

const QUARTER_ORDER = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_COLUMNS = {
  Q1: { scoreCol: 7, totalCol: 8, basisCol: 9 },
  Q2: { scoreCol: 10, totalCol: 11, basisCol: 12 },
  Q3: { scoreCol: 13, totalCol: 14, basisCol: 15 },
  Q4: { scoreCol: 16, totalCol: 18, basisCol: 19 },
};
const COLUMN_WIDTHS = [
  48, 120, 44, 52, 170, 220, 220, 52, 95, 190, 52, 95, 190, 52, 95, 190, 52,
  0, 95, 190,
];
const DEFAULT_HEADER_ROW = [
  "部门",
  "评价项目",
  "项目分数",
  "权重",
  "小项",
  "部品评分项目",
  "计分规则",
  "各项分数",
  "第1季度\n得分",
  "第1季度\n评分依据信息",
  "各项分数",
  "第2季度\n得分",
  "第2季度\n评分依据信息",
  "各项分数",
  "第3季度\n得分",
  "第3季度\n评分依据信息",
  "各项分数",
  "",
  "第4季度\n得分",
  "第4季度\n评分依据信息",
];
const JUDGEMENT_RULE_ROWS = [
  { label: "A:通过", description: "", labelRowspan: 1 },
  { label: "B:条件性通过", description: "", labelRowspan: 2 },
  { label: "", description: "80%≤总分≤100%,但50%≤单项得分<70%", labelRowspan: 0 },
  { label: "C:不通过", description: "总分<70%", labelRowspan: 1 },
];

const queryParams = reactive({
  year: String(new Date().getFullYear()),
});

const qualityAgreementUrl = ref("");
const loading = ref(false);
const hasSearched = ref(false);
const tableRows = ref([]);
const tableMerges = ref([]);
const excelTableWrapRef = ref(null);
const spacePressed = ref(false);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartScrollLeft = ref(0);
const quarterVisibleState = ref({
  Q1: true,
  Q2: true,
  Q3: true,
  Q4: true,
});

const isMatched = computed(() => tableRows.value.length > 1);
const hiddenQuarterColumns = computed(() => {
  const hidden = new Set();
  Object.entries(QUARTER_COLUMNS).forEach(([quarter, cols]) => {
    if (!quarterVisibleState.value[quarter]) {
      hidden.add(cols.scoreCol);
      hidden.add(cols.totalCol);
      hidden.add(cols.basisCol);
    }
  });
  return hidden;
});
const visibleColumnIndices = computed(() =>
  COLUMN_WIDTHS.map((_, index) => index).filter(
    (index) => !hiddenQuarterColumns.value.has(index)
  )
);
const visibleColumnSet = computed(() => new Set(visibleColumnIndices.value));
const visibleColumns = computed(() =>
  visibleColumnIndices.value.map((index) => ({
    index,
    width: COLUMN_WIDTHS[index],
  }))
);

function projectMergeToVisibleColumns(merge) {
  const visibleCols = [];
  for (let col = merge.s.c; col <= merge.e.c; col += 1) {
    if (visibleColumnSet.value.has(col)) visibleCols.push(col);
  }
  if (!visibleCols.length) return null;
  return {
    s: { r: merge.s.r, c: visibleCols[0] },
    e: { r: merge.e.r, c: visibleCols[visibleCols.length - 1] },
  };
}

const visibleMerges = computed(() =>
  tableMerges.value.map(projectMergeToVisibleColumns).filter(Boolean)
);
const mergeMap = computed(() => {
  const map = new Map();
  visibleMerges.value.forEach((merge) => {
    map.set(`${merge.s.r}-${merge.s.c}`, {
      rowspan: merge.e.r - merge.s.r + 1,
      colspan: merge.e.c - merge.s.c + 1,
    });
  });
  return map;
});
const coveredCells = computed(() => {
  const set = new Set();
  visibleMerges.value.forEach((merge) => {
    for (let row = merge.s.r; row <= merge.e.r; row += 1) {
      for (let col = merge.s.c; col <= merge.e.c; col += 1) {
        if (row === merge.s.r && col === merge.s.c) continue;
        set.add(`${row}-${col}`);
      }
    }
  });
  return set;
});

const conclusionRowIndex = computed(() =>
  tableRows.value.findIndex((row) =>
    (row || []).some((cell) => String(cell || "").trim() === "评审结论：")
  )
);
const judgementStartRowIndex = computed(() =>
  tableRows.value.findIndex((row) => String(row?.[0] || "").trim() === "判定")
);

function getCellClassName(row, col, value) {
  const classNames = [];
  const normalizedText = String(value || "").replace(/\s+/g, "");

  if (row === 0) {
    classNames.push("header-cell", "header-center-cell");
    if ([7, 8, 9].includes(col)) classNames.push("q1-header");
    if ([10, 11, 12].includes(col)) classNames.push("q2-header");
    if ([13, 14, 15].includes(col)) classNames.push("q3-header");
    if ([16, 17, 18, 19].includes(col)) classNames.push("q4-header");
  }

  if (["部门", "权重", "项目分数", "各项分数"].includes(normalizedText)) {
    classNames.push("keyword-center-cell");
  }
  if (row > 0 && [0, 2, 3].includes(col)) classNames.push("base-center-cell");
  if (row > 0 && isScoreCol(col)) classNames.push("score-center-cell");
  if (row > 0 && [8, 11, 14, 18].includes(col)) classNames.push("quarter-score-cell");
  if ([0, 1, 2, 3, 4, 7, 8, 10, 11, 13, 14, 16, 18].includes(col)) {
    classNames.push("nowrap-cell");
  }
  if (row > 0 && [5, 6, 9, 12, 15, 19].includes(col)) {
    classNames.push("rule-cell");
  }
  if (row > 0 && col <= 7) classNames.push("left-area-cell");
  if (
    judgementStartRowIndex.value >= 0 &&
    row === judgementStartRowIndex.value &&
    [7, 10, 13, 16].includes(col)
  ) {
    classNames.push("judgement-summary-cell");
  }
  if (!value || !String(value).trim()) classNames.push("empty-cell");
  return classNames.join(" ");
}

function isScoreCol(col) {
  return [7, 8, 10, 11, 13, 14, 16, 18].includes(col);
}

function normalizeCellValue(rowIndex, colIndex, value) {
  const raw = value == null ? "" : String(value);
  if (colIndex === 6 && rowIndex > 0) {
    return raw.replace(/\r?\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  }
  return raw;
}

const displayRows = computed(() =>
  tableRows.value.map((row, rowIndex) =>
    row
      .map((value, colIndex) => {
        if (!visibleColumnSet.value.has(colIndex)) return null;
        const key = `${rowIndex}-${colIndex}`;
        if (coveredCells.value.has(key)) return null;
        const span = mergeMap.value.get(key) || { rowspan: 1, colspan: 1 };
        const normalizedValue = normalizeCellValue(rowIndex, colIndex, value);
        const shouldHideGapCol = colIndex === 17 && span.colspan === 1;
        return {
          value: normalizedValue,
          col: colIndex,
          rowspan: span.rowspan,
          colspan: span.colspan,
          className: [
            getCellClassName(rowIndex, colIndex, normalizedValue),
            shouldHideGapCol ? "hidden-gap-col" : "",
            span.rowspan > 1 || span.colspan > 1 ? "merged-cell" : "",
          ]
            .filter(Boolean)
            .join(" "),
        };
      })
      .filter(Boolean)
  )
);

function isJudgementSummaryCell(rowIndex, col) {
  return (
    judgementStartRowIndex.value >= 0 &&
    rowIndex === judgementStartRowIndex.value &&
    [7, 10, 13, 16].includes(col)
  );
}

function hasJudgementSummaryValue(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean).length >= 2;
}

function getJudgementQuarterText(value, col) {
  const line = String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)[0];
  if (line) return line;
  if (col === 7) return "Q1";
  if (col === 10) return "Q2";
  if (col === 13) return "Q3";
  if (col === 16) return "Q4";
  return "";
}

function getJudgementScoreText(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (lines.length >= 2) return lines[lines.length - 1];
  return "";
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (Number.isInteger(number)) return String(number);
  return String(number)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function formatSummaryScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.00$/, "");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/[0-9０-９]+(?:\.[0-9０-９]+)?%?/g, "")
    .replace(/分/g, "")
    .replace(/[；;，,。.\-—_:：()（）]/g, "")
    .toLowerCase();
}

function toDisplayText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "number") return value;
    if (String(value).trim() !== "") return value;
  }
  return "";
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function createEmptyRow() {
  return Array.from({ length: COLUMN_WIDTHS.length }, () => "");
}

function appendMerge(merges, startRow, startCol, endRow, endCol) {
  if (endRow < startRow || endCol < startCol) return;
  if (startRow === endRow && startCol === endCol) return;
  merges.push({
    s: { r: startRow, c: startCol },
    e: { r: endRow, c: endCol },
  });
}

function resolveDepartmentKey(dept, deptIndex) {
  return (
    toDisplayText(pickFirstValue(dept?.deptId, dept?.departmentId)) ||
    normalizeText(
      pickFirstValue(dept?.deptName, dept?.departmentName, `dept-${deptIndex}`)
    ) ||
    `dept-${deptIndex}`
  );
}

function resolveProjectKey(project, projectIndex) {
  const projectId = toDisplayText(pickFirstValue(project?.projectId, project?.id));
  if (projectId) return projectId;
  const rawKey = normalizeText(
    [
      pickFirstValue(project?.projectName, project?.name),
      pickFirstValue(project?.projectScore, project?.maxScore, project?.score),
      pickFirstValue(project?.weight, project?.projectWeight),
    ].join("__")
  );
  return rawKey || `project-${projectIndex}`;
}

function resolveProjectTitle(project, item) {
  return toDisplayText(
    pickFirstValue(
      project?.projectName,
      project?.name,
      project?.evalProjectName,
      item?.projectName,
      item?.projectTitle,
      item?.categoryName
    )
  );
}

function resolveProjectScore(project, item) {
  return pickFirstValue(
    project?.projectScore,
    project?.maxScore,
    project?.score,
    project?.totalScore,
    item?.projectScore,
    item?.itemMaxScore
  );
}

function resolveProjectWeight(project, item) {
  return pickFirstValue(project?.weight, project?.projectWeight, item?.weight);
}

function resolveItemName(project, item) {
  return toDisplayText(
    pickFirstValue(
      item?.itemName,
      item?.subItemName,
      item?.scoreItemName,
      item?.name,
      project?.itemName,
      project?.scoreItemName,
      project?.projectName
    )
  );
}

function resolveItemProjectDesc(project, item) {
  return toDisplayText(
    pickFirstValue(
      item?.scoreProjectName,
      item?.scoreProject,
      item?.projectDesc,
      item?.itemDesc,
      item?.description,
      item?.content,
      project?.scoreProjectName,
      project?.scoreProject,
      item?.itemName
    )
  );
}

function resolveItemRule(project, item) {
  return toDisplayText(
    pickFirstValue(
      item?.overrideScoreRule,
      item?.scoreRule,
      project?.overrideScoreRule,
      project?.scoreRule
    )
  );
}

function resolveItemDefId(project, item) {
  return toDisplayText(pickFirstValue(item?.itemDefId, project?.itemDefId));
}

function resolveItemMaxScore(project, item) {
  return pickFirstValue(
    item?.itemMaxScore,
    item?.maxScore,
    project?.itemMaxScore,
    project?.maxScore,
    project?.projectScore
  );
}

function resolveItemKey(project, item, itemIndex) {
  const itemDefId = resolveItemDefId(project, item);
  if (itemDefId) return itemDefId;
  const rawKey = normalizeText(
    [
      resolveItemName(project, item),
      resolveItemProjectDesc(project, item),
      resolveItemRule(project, item),
      resolveItemMaxScore(project, item),
    ].join("__")
  );
  return rawKey || `item-${itemIndex}`;
}

function createFallbackItem(project) {
  return {
    itemName: pickFirstValue(project?.itemName, project?.projectName, project?.name),
    scoreProjectName: pickFirstValue(
      project?.scoreProjectName,
      project?.scoreProject,
      project?.projectDesc
    ),
    scoreRule: pickFirstValue(project?.scoreRule, project?.overrideScoreRule),
    itemDefId: project?.itemDefId,
    itemMaxScore: pickFirstValue(project?.itemMaxScore, project?.maxScore),
    score: project?.score,
    scoreBasis: project?.scoreBasis,
  };
}

function sumQuarterScore(rows, startRow, endRow, scoreCol) {
  let total = 0;
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const score = Number(rows?.[rowIndex]?.[scoreCol]);
    if (Number.isFinite(score)) total += score;
  }
  return total;
}

function calcQuarterSummaryFromRows(rows, quarter, bindings) {
  const cols = QUARTER_COLUMNS[quarter];
  if (!cols) return 0;
  let total = 0;
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const binding = bindings.get(`${rowIndex}-${quarter}`);
    if (!binding?.itemDefId) continue;
    const score = Number(rows[rowIndex]?.[cols.scoreCol]);
    if (Number.isFinite(score)) total += score;
  }
  return total;
}

function buildAssessmentTable(data) {
  const departmentOrder = [];
  const departmentMap = new Map();

  QUARTER_ORDER.forEach((quarter) => {
    const quarterData = (data?.quarters || []).find((item) => item?.quarter === quarter);
    (quarterData?.departments || []).forEach((dept, deptIndex) => {
      const deptKey = resolveDepartmentKey(dept, deptIndex);
      let deptNode = departmentMap.get(deptKey);
      if (!deptNode) {
        deptNode = {
          key: deptKey,
          name: toDisplayText(
            pickFirstValue(dept?.deptName, dept?.departmentName, deptKey)
          ),
          quarterScores: {},
          projects: [],
          projectMap: new Map(),
        };
        departmentMap.set(deptKey, deptNode);
        departmentOrder.push(deptNode);
      }
      deptNode.quarterScores[quarter] = pickFirstValue(
        dept?.deptScore,
        dept?.quarterTotalScore
      );

      (dept?.projects || []).forEach((project, projectIndex) => {
        const projectKey = resolveProjectKey(project, projectIndex);
        let projectNode = deptNode.projectMap.get(projectKey);
        if (!projectNode) {
          projectNode = {
            key: projectKey,
            title: resolveProjectTitle(project),
            projectScore: resolveProjectScore(project),
            weight: resolveProjectWeight(project),
            items: [],
            itemMap: new Map(),
          };
          deptNode.projectMap.set(projectKey, projectNode);
          deptNode.projects.push(projectNode);
        }

        if (!projectNode.title) projectNode.title = resolveProjectTitle(project);
        if (projectNode.projectScore === "") {
          projectNode.projectScore = resolveProjectScore(project);
        }
        if (projectNode.weight === "") {
          projectNode.weight = resolveProjectWeight(project);
        }

        const rawItems =
          Array.isArray(project?.items) && project.items.length
            ? project.items
            : [createFallbackItem(project)];

        rawItems.forEach((item, itemIndex) => {
          const itemKey = resolveItemKey(project, item, itemIndex);
          let itemNode = projectNode.itemMap.get(itemKey);
          if (!itemNode) {
            itemNode = {
              key: itemKey,
              itemName: resolveItemName(project, item),
              itemProjectDesc: resolveItemProjectDesc(project, item),
              scoreRule: resolveItemRule(project, item),
              itemDefId: resolveItemDefId(project, item),
              itemMaxScore: resolveItemMaxScore(project, item),
              quarters: {},
            };
            projectNode.itemMap.set(itemKey, itemNode);
            projectNode.items.push(itemNode);
          }

          if (!itemNode.itemName) itemNode.itemName = resolveItemName(project, item);
          if (!itemNode.itemProjectDesc) {
            itemNode.itemProjectDesc = resolveItemProjectDesc(project, item);
          }
          if (!itemNode.scoreRule) itemNode.scoreRule = resolveItemRule(project, item);
          if (!itemNode.itemDefId) itemNode.itemDefId = resolveItemDefId(project, item);
          if (itemNode.itemMaxScore === "") {
            itemNode.itemMaxScore = resolveItemMaxScore(project, item);
          }

          itemNode.quarters[quarter] = {
            score: item?.score,
            scoreBasis: item?.scoreBasis || "",
            itemDefId: resolveItemDefId(project, item) || itemNode.itemDefId,
            itemMaxScore: resolveItemMaxScore(project, item) || itemNode.itemMaxScore,
          };
        });
      });
    });
  });

  if (!departmentOrder.length) {
    return { rows: [], merges: [] };
  }

  const rows = [DEFAULT_HEADER_ROW.slice()];
  const merges = [];
  const itemBindings = new Map();

  appendMerge(merges, 0, 16, 0, 17);

  departmentOrder.forEach((deptNode) => {
    const deptStartRow = rows.length;

    deptNode.projects.forEach((projectNode) => {
      const projectStartRow = rows.length;
      const projectItems = projectNode.items.length
        ? projectNode.items
        : [
            {
              itemName: "",
              itemProjectDesc: "",
              scoreRule: "",
              itemDefId: "",
              itemMaxScore: "",
              quarters: {},
            },
          ];

      projectItems.forEach((itemNode) => {
        const rowIndex = rows.length;
        const row = createEmptyRow();
        row[0] = deptNode.name;
        row[1] = projectNode.title;
        row[2] =
          projectNode.projectScore === ""
            ? itemNode.itemMaxScore || ""
            : projectNode.projectScore;
        row[3] = projectNode.weight;
        row[4] = itemNode.itemName;
        row[5] = itemNode.itemProjectDesc;
        row[6] = itemNode.scoreRule;

        QUARTER_ORDER.forEach((quarter) => {
          const cols = QUARTER_COLUMNS[quarter];
          const quarterValue = itemNode.quarters[quarter] || {};
          row[cols.scoreCol] =
            quarterValue.score === undefined || quarterValue.score === null
              ? ""
              : formatNumber(quarterValue.score);
          row[cols.basisCol] = quarterValue.scoreBasis || "";

          const itemDefId = toDisplayText(quarterValue.itemDefId);
          if (itemDefId) {
            itemBindings.set(`${rowIndex}-${quarter}`, {
              itemDefId,
              itemMaxScore: quarterValue.itemMaxScore,
            });
          }
        });

        rows.push(row);
      });

      const projectEndRow = rows.length - 1;
      if (projectEndRow > projectStartRow) {
        [1, 2, 3].forEach((col) =>
          appendMerge(merges, projectStartRow, col, projectEndRow, col)
        );
      }
    });

    const deptEndRow = rows.length - 1;
    if (deptEndRow >= deptStartRow) {
      appendMerge(merges, deptStartRow, 0, deptEndRow, 0);
      QUARTER_ORDER.forEach((quarter) => {
        const cols = QUARTER_COLUMNS[quarter];
        const deptScore = deptNode.quarterScores[quarter];
        rows[deptStartRow][cols.totalCol] = formatNumber(
          deptScore === ""
            ? sumQuarterScore(rows, deptStartRow, deptEndRow, cols.scoreCol)
            : deptScore
        );
        appendMerge(merges, deptStartRow, cols.totalCol, deptEndRow, cols.totalCol);
      });
    }
  });

  const judgementRowIndex = rows.length;
  JUDGEMENT_RULE_ROWS.forEach((ruleRow, index) => {
    const row = createEmptyRow();
    if (index === 0) {
      row[0] = "判定";
      QUARTER_ORDER.forEach((quarter) => {
        const { scoreCol } = QUARTER_COLUMNS[quarter];
        row[scoreCol] = `${quarter}\n${formatSummaryScore(
          calcQuarterSummaryFromRows(rows, quarter, itemBindings)
        )}`;
      });
    }
    row[1] = ruleRow.label;
    row[2] = ruleRow.description;
    rows.push(row);
  });

  const judgementEndRowIndex = rows.length - 1;
  appendMerge(merges, judgementRowIndex, 0, judgementEndRowIndex, 0);
  appendMerge(merges, judgementRowIndex, 7, judgementEndRowIndex, 9);
  appendMerge(merges, judgementRowIndex, 10, judgementEndRowIndex, 12);
  appendMerge(merges, judgementRowIndex, 13, judgementEndRowIndex, 15);
  appendMerge(merges, judgementRowIndex, 16, judgementEndRowIndex, 19);

  JUDGEMENT_RULE_ROWS.forEach((ruleRow, index) => {
    const rowIndex = judgementRowIndex + index;
    if (ruleRow.labelRowspan > 1) {
      appendMerge(merges, rowIndex, 1, rowIndex + ruleRow.labelRowspan - 1, 1);
    }
    appendMerge(merges, rowIndex, 2, rowIndex, 6);
  });

  const conclusionRowIndex = rows.length;
  const conclusionRow = createEmptyRow();
  conclusionRow[0] = "评审结论：";
  conclusionRow[1] = data?.conclusion?.conclusionText || "";
  rows.push(conclusionRow);
  appendMerge(merges, conclusionRowIndex, 1, conclusionRowIndex, 19);

  return { rows, merges };
}

function handleQuery() {
  if (!String(queryParams.year || "").trim()) {
    ElMessage.warning("请选择年份后再查询");
    return;
  }
  hasSearched.value = true;
  loadAssessmentData();
}

function resetQuery() {
  queryParams.year = String(new Date().getFullYear());
  qualityAgreementUrl.value = "";
  tableRows.value = [];
  tableMerges.value = [];
  hasSearched.value = false;
  quarterVisibleState.value = {
    Q1: true,
    Q2: true,
    Q3: true,
    Q4: true,
  };
  handleQuery();
}

function loadAssessmentData() {
  const year = Number(queryParams.year || new Date().getFullYear());
  loading.value = true;
  getVendorAssessmentYearly({ year })
    .then((res) => {
      const data = res?.data || {};
      qualityAgreementUrl.value = data.qualityAgreement || "";

      const nextQuarterVisible = {
        Q1: false,
        Q2: false,
        Q3: false,
        Q4: false,
      };
      (data.quarters || []).forEach((quarterData) => {
        const quarter = quarterData?.quarter;
        if (!QUARTER_ORDER.includes(quarter)) return;
        const total = Number(quarterData?.quarterTotalScore);
        nextQuarterVisible[quarter] = Number.isFinite(total) && total > 0;
      });
      quarterVisibleState.value = nextQuarterVisible;

      const { rows, merges } = buildAssessmentTable(data);
      tableRows.value = rows;
      tableMerges.value = merges;
    })
    .catch((error) => {
      tableRows.value = [];
      tableMerges.value = [];
      ElMessage.error(error?.message || "加载考核数据失败");
    })
    .finally(() => {
      loading.value = false;
    });
}

function isTypingTarget(target) {
  if (!target) return false;
  const tagName = String(target.tagName || "").toLowerCase();
  if (["input", "textarea", "select"].includes(tagName)) return true;
  return Boolean(target.isContentEditable);
}

function handleWindowKeyDown(event) {
  if (event.code !== "Space") return;
  if (isTypingTarget(event.target)) return;
  if (!spacePressed.value) spacePressed.value = true;
  event.preventDefault();
}

function handleWindowKeyUp(event) {
  if (event.code !== "Space") return;
  spacePressed.value = false;
  stopTableDrag();
}

function handleTableMouseDown(event) {
  if (!spacePressed.value || event.button !== 0) return;
  const wrap = excelTableWrapRef.value;
  if (!wrap) return;
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartScrollLeft.value = wrap.scrollLeft;
  window.addEventListener("mousemove", handleTableMouseMove);
  window.addEventListener("mouseup", stopTableDrag);
  event.preventDefault();
}

function handleTableMouseMove(event) {
  if (!isDragging.value) return;
  const wrap = excelTableWrapRef.value;
  if (!wrap) return;
  wrap.scrollLeft = dragStartScrollLeft.value - (event.clientX - dragStartX.value);
}

function stopTableDrag() {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener("mousemove", handleTableMouseMove);
  window.removeEventListener("mouseup", stopTableDrag);
}

function getAttachmentHref(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_APP_BASE_API || ""}${url}`;
}

onMounted(() => {
  window.addEventListener("keydown", handleWindowKeyDown);
  window.addEventListener("keyup", handleWindowKeyUp);
  handleQuery();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleWindowKeyDown);
  window.removeEventListener("keyup", handleWindowKeyUp);
  stopTableDrag();
});
</script>

<style lang="scss" scoped>
.assessment-page {
  height: calc(100vh - 90px);
  max-height: calc(100vh - 90px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.assessment-excel-page {
  --excel-border-color: #9fb0c5;
  --excel-border-strong: #7f93ac;
  --excel-text-main: #1f2a37;
  --excel-text-secondary: #3f4d60;
  --excel-header-bg: #dbe3ef;
  --excel-header-text: #0f172a;
  background: #fff;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.quality-agreement-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}

.quality-agreement-link:hover {
  text-decoration: underline;
}

:deep(.search-bar__actions) {
  flex: 1 1 auto;
  margin-left: 0 !important;
}

:deep(.search-bar__actions .el-form-item__content) {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 10px;
}

.quality-agreement-link--right {
  margin-left: auto;
}

.excel-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  position: relative;
  background: #fff;
  border: 1px solid var(--excel-border-color);
  box-shadow: inset 0 0 0 1px #c4cfdd;
}

.excel-table-wrap::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.excel-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(127, 147, 172, 0.55);
  border-radius: 999px;
}

.excel-table-wrap::-webkit-scrollbar-track {
  background: rgba(159, 176, 197, 0.12);
}

.excel-table-wrap.is-space-pan {
  cursor: grab;
  user-select: none;
}

.excel-table-wrap.is-space-pan :deep(*) {
  cursor: grab !important;
}

.excel-table-wrap.is-dragging {
  cursor: grabbing;
}

.excel-table-wrap.is-dragging :deep(*) {
  cursor: grabbing !important;
}

.empty-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.excel-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: max-content;
  min-width: 100%;

  td {
    position: relative;
    border: 1px solid var(--excel-border-color);
    min-height: 42px;
    vertical-align: top;
    background: #fff;
    color: var(--excel-text-main);
    font-size: 12px;
    line-height: 1.45;
    padding: 8px;
  }
}

.cell-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.header-cell {
  position: sticky !important;
  top: 0 !important;
  z-index: 30 !important;
  background: var(--excel-header-bg) !important;
  color: var(--excel-header-text) !important;
  text-align: center;
  font-weight: 700;
  font-size: 12px !important;
  line-height: 1.2 !important;
  vertical-align: middle !important;
  padding: 6px 8px !important;
  box-shadow: 0 1px 0 var(--excel-border-strong);
  border-bottom: 1px solid var(--excel-border-strong) !important;
}

.header-center-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

:deep(.header-center-cell .cell-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.q1-header {
  background: #b8a2f6 !important;
  color: #1f1a33 !important;
}

.q2-header {
  background: #9fd9aa !important;
  color: #173224 !important;
}

.q3-header {
  background: #8ecde6 !important;
  color: #183243 !important;
}

.q4-header {
  background: #8fd4a2 !important;
  color: #173224 !important;
}

.left-area-cell {
  background: #f8fbff;
}

.quarter-score-cell {
  background: #f2f7fd;
  text-align: center;
  font-weight: 600;
  color: var(--excel-text-secondary);
}

.score-center-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

.keyword-center-cell,
.base-center-cell,
.merged-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

:deep(.keyword-center-cell .cell-content),
:deep(.base-center-cell .cell-content),
:deep(.score-center-cell .cell-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.empty-cell {
  color: transparent;
}

:deep(.hidden-gap-col) {
  padding: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  width: 0 !important;
  min-width: 0 !important;
}

:deep(.hidden-gap-col .cell-content) {
  display: none !important;
}

:deep(.nowrap-cell .cell-content) {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.rule-cell) {
  vertical-align: top !important;
}

:deep(.rule-cell .cell-content) {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  text-align: left;
  color: var(--excel-text-secondary);
}

:deep(.judgement-summary-cell .cell-content) {
  white-space: pre-line !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  font-weight: 700;
  line-height: 1.6;
  color: #111827;
  font-size: 34px;
}

:deep(.judgement-summary-content .judgement-q) {
  color: #ff2d20;
  font-size: 34px;
  line-height: 1.3;
}

:deep(.judgement-summary-content .judgement-score) {
  color: #111827;
  font-size: 34px;
  line-height: 1.3;
}
</style>
