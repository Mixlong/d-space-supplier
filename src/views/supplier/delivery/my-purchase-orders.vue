<template>
    <div class="app-container delivery-page">
        <search-bar
            :model="queryParams"
            @search="handleQuery"
            @reset="resetQuery"
        >
            <el-form-item label="时间范围">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 320px"
                />
            </el-form-item>
        </search-bar>
        <page-table
            class="delivery-page-table"
            :total="total"
            v-model:page="queryParams.p"
            v-model:size="queryParams.l"
            @pagination="getList"
        >
            <el-table
                v-loading="loading"
                :data="tableData"
                height="100%"
                border
                stripe
                align="center"
                header-align="center"
            >
                <el-table-column label="序号" width="65" align="center" label-class-name="hdr-order">
                    <template #default="{ $index }">
                        {{ (queryParams.p - 1) * queryParams.l + $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column
                    prop="poCode"
                    label="采购订单号"
                    min-width="180"
                    class-name="nowrap-cell"
                    label-class-name="hdr-order"
                >
                    <template #header>
                        <el-popover
                            v-model:visible="columnFilterVisible.poCode"
                            placement="bottom"
                            :width="280"
                            trigger="click"
                        >
                            <template #reference>
                                <div class="column-filter-trigger" :class="{ 'is-active': !!queryParams.poCode }">
                                    <span>采购订单号</span>
                                    <el-icon
                                        class="column-filter-trigger__icon"
                                        :class="{ 'is-active': !!queryParams.poCode }"
                                    >
                                        <Filter />
                                    </el-icon>
                                </div>
                            </template>
                            <div class="column-filter-popover">
                                <el-input
                                    v-model="queryParams.poCode"
                                    placeholder="请输入采购单号"
                                    clearable
                                    @keyup.enter="applyColumnFilter('poCode')"
                                />
                                <div class="column-filter-popover__footer">
                                    <el-button type="primary" text @click="applyColumnFilter('poCode')">筛选</el-button>
                                    <el-button text @click="resetColumnFilter('poCode')">重置</el-button>
                                </div>
                            </div>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="invCode"
                    label="物料编号"
                    min-width="150"
                    class-name="nowrap-cell"
                    label-class-name="hdr-order"
                >
                    <template #header>
                        <el-popover
                            v-model:visible="columnFilterVisible.invCode"
                            placement="bottom"
                            :width="280"
                            trigger="click"
                        >
                            <template #reference>
                                <div class="column-filter-trigger" :class="{ 'is-active': !!queryParams.invCode }">
                                    <span>物料编号</span>
                                    <el-icon
                                        class="column-filter-trigger__icon"
                                        :class="{ 'is-active': !!queryParams.invCode }"
                                    >
                                        <Filter />
                                    </el-icon>
                                </div>
                            </template>
                            <div class="column-filter-popover">
                                <el-input
                                    v-model="queryParams.invCode"
                                    placeholder="请输入物料编号"
                                    clearable
                                    @keyup.enter="applyColumnFilter('invCode')"
                                />
                                <div class="column-filter-popover__footer">
                                    <el-button type="primary" text @click="applyColumnFilter('invCode')">筛选</el-button>
                                    <el-button text @click="resetColumnFilter('invCode')">重置</el-button>
                                </div>
                            </div>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="quantity"
                    label="采购数量"
                    min-width="80"
                    align="center"
                    label-class-name="hdr-order"
                />
                <el-table-column
                    prop="deliveredQty"
                    label="供应商已送数量"
                   width="110"
                    align="center"
                    label-class-name="hdr-delivery"
                />
                <el-table-column
                    prop="remainingQty"
                    label="待交付数量"
                    width="100"
                    align="center"
                    label-class-name="hdr-delivery"
                >
                    <template #default="{ row }">
                        <span class="pending-qty">{{ row.remainingQty }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="ireceivedqty"
                    label="迪太已入库数量"
                    width="110"
                    align="center"
                    label-class-name="hdr-delivery"
                >
                    <template #default="{ row }">
                        <span>{{ row.ireceivedqty ?? row.storageQty ?? 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="planArriveDate"
                    label="迪太要求到货日期"
                    min-width="220"
                    align="center"
                    label-class-name="hdr-demand"
                    class-name="top-align-cell"
                >
                    <template #default="{ row }">
                        <div v-if="parsePmcPlans(row).length > 0" class="pmc-plan-inline">
                            <div
                                v-for="(plan, index) in parsePmcPlans(row)"
                                :key="`pmc-${row.id}-${index}`"
                                class="pmc-plan-inline-item"
                            >
                                <span class="pmc-plan-date">日期：<span class="stat-num">{{ formatReplyPlanDate(plan.planDate) }}</span></span>
                                <span class="pmc-plan-qty">数量：<span class="stat-num">{{ plan.deliveryQty }}</span></span>
                            </div>
                        </div>
                        <span v-else-if="row.planArriveDate" class="pmc-plan-single">日期：<span class="stat-num">{{ row.planArriveDate }}</span></span>
                        <span v-else class="no-date">-</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="vendorReplyDate"
                    label="供应商回复日期"
                    min-width="220"
                    align="center"
                    label-class-name="hdr-demand"
                    class-name="top-align-cell"
                >
                    <template #default="{ row }">
                        <span v-if="!row.vendorReplyDate" class="no-date">-</span>
                        <div v-else-if="parseReplyPlans(row).length > 0" class="pmc-plan-inline">
                            <div
                                v-for="(plan, index) in parseReplyPlans(row)"
                                :key="`reply-${row.id}-${index}`"
                                class="pmc-plan-inline-item"
                            >
                                <span class="pmc-plan-date">日期：<span class="stat-num">{{ formatReplyPlanDate(plan.replyDate) }}</span></span>
                                <span class="pmc-plan-qty">数量：<span class="stat-num">{{ plan.deliveryQty }}</span></span>
                            </div>
                        </div>
                        <span v-else class="pmc-plan-single">日期：<span class="stat-num">{{ row.vendorReplyDate }}</span></span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="deliveryConfirmationList"
                    label="实际送货日期"
                    min-width="220"
                    align="center"
                    label-class-name="hdr-demand"
                    class-name="top-align-cell"
                >
                    <template #default="{ row }">
                        <span
                            v-if="parseDeliveryConfirmations(row).length === 0"
                            class="no-date"
                        >-</span>
                        <div v-else class="pmc-plan-inline">
                            <div
                                v-for="(item, index) in parseDeliveryConfirmations(row)"
                                :key="`delivery-${row.id}-${index}`"
                                class="pmc-plan-inline-item"
                            >
                                <span class="pmc-plan-date">日期：<span class="stat-num">{{ formatReplyPlanDate(item.actualDeliveryDate) }}</span></span>
                                <span class="pmc-plan-qty">数量：<span class="stat-num">{{ item.deliveryQty ?? 0 }}</span></span>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="deliveryStatus"
                    label="交付状态"
                    width="120"
                    align="center"
                    label-class-name="hdr-reply"
                >
                    <template #header>
                        <el-popover
                            v-model:visible="columnFilterVisible.deliveryStatus"
                            placement="bottom"
                            :width="240"
                            trigger="click"
                        >
                            <template #reference>
                                <div class="column-filter-trigger" :class="{ 'is-active': !!queryParams.deliveryStatus }">
                                    <span>交付状态</span>
                                    <el-icon
                                        class="column-filter-trigger__icon"
                                        :class="{ 'is-active': !!queryParams.deliveryStatus }"
                                    >
                                        <Filter />
                                    </el-icon>
                                </div>
                            </template>
                            <div class="column-filter-popover">
                                <el-select
                                    v-model="queryParams.deliveryStatus"
                                    clearable
                                    placeholder="请选择交付状态"
                                    :teleported="false"
                                    style="width: 100%"
                                >
                                    <el-option label="未交付" value="未交付" />
                                    <el-option label="部分交付" value="部分交付" />
                                    <el-option label="已完成" value="已完成" />
                                </el-select>
                                <div class="column-filter-popover__footer">
                                    <el-button type="primary" text @click="applyColumnFilter('deliveryStatus')">筛选</el-button>
                                    <el-button text @click="resetColumnFilter('deliveryStatus')">重置</el-button>
                                </div>
                            </div>
                        </el-popover>
                    </template>
                    <template #default="{ row }">
                        <el-tag
                            :type="statusType(row.deliveryStatus)"
                            size="small"
                            >{{ row.deliveryStatus || "未交付" }}</el-tag
                        >
                    </template>
                </el-table-column>
                <el-table-column
                    label="操作"
                    width="140"
                    fixed="right"
                    align="center"
                    label-class-name="hdr-action"
                >
                    <template #default="{ row }">
                        <div class="action-stack">
                            <el-button
                                v-if="!row.vendorReplyDate"
                                link
                                type="warning"
                                @click="openReplyDateDialog(row)"
                                >回复日期</el-button
                            >
                            <el-button
                                v-else-if="canSubmitDelivery(row)"
                                link
                                type="primary"
                                @click="openSubmitDialog(row)"
                                >提交交付</el-button
                            >
                            <el-button
                                link
                                type="success"
                                @click="openBatchLabelDialog(row)"
                                >批次号</el-button
                            >
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </page-table>

        <!-- 提交交付对话框 -->
        <el-dialog
            v-model="dialogVisible"
            title="提交交付确认"
            width="520px"
            destroy-on-close
        >
            <el-form
                ref="submitFormRef"
                :model="submitForm"
                :rules="submitRules"
                label-width="120px"
            >
                <el-form-item label="采购订单号">
                    <el-input :model-value="currentRow.poCode" disabled />
                </el-form-item>
                <el-form-item label="本次交付数量" prop="deliveryQty">
                    <el-input-number
                        v-model="submitForm.deliveryQty"
                        :min="1"
                        :max="maxQty"
                        :step="1"
                        :step-strictly="true"
                        :precision="0"
                        placeholder="请输入本次交付数量"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="实际交付日期" prop="actualDeliveryDate">
                    <el-date-picker
                        v-model="submitForm.actualDeliveryDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择实际交付日期"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input
                        v-model="submitForm.remark"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入备注（选填）"
                        maxlength="200"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="submitLoading"
                    @click="handleSubmit"
                    >提交</el-button
                >
            </template>
        </el-dialog>

        <!-- 回复日期对话框 -->
        <el-dialog
            v-model="replyDateDialogVisible"
            title="供应商回复计划确认"
            width="680px"
            destroy-on-close
            class="reply-plan-dialog"
        >
            <el-form
                ref="replyDateFormRef"
                :model="replyDateForm"
                :rules="replyDateRules"
                label-width="100px"
            >
                <!-- 订单信息摘要 -->
                <div class="rd-info-bar">
                    <div class="rd-info-bar__item">
                        <span class="rd-info-bar__label">采购订单号</span>
                        <span class="rd-info-bar__value">{{ currentRow.poCode || '-' }}</span>
                    </div>
                    <div class="rd-info-bar__item">
                        <span class="rd-info-bar__label">存货编码</span>
                        <span class="rd-info-bar__value">{{ currentRow.invCode || '-' }}</span>
                    </div>
                    <div class="rd-info-bar__item">
                        <span class="rd-info-bar__label">采购数量</span>
                        <span class="rd-info-bar__value">{{ currentRow.quantity || 0 }}</span>
                    </div>
                    <div class="rd-info-bar__item">
                        <span class="rd-info-bar__label">待交付</span>
                        <span class="rd-info-bar__value rd-info-bar__value--warn">{{ currentRow.remainingQty || 0 }}</span>
                    </div>
                </div>

                <!-- 迪太要求到货日期 -->
                <div class="rd-section">
                    <div class="rd-section__title">迪太要求到货日期</div>
                    <div v-if="parsePmcPlans(currentRow).length > 0" class="rd-pmc-list">
                        <div
                            v-for="(plan, index) in parsePmcPlans(currentRow)"
                            :key="`pmc-${index}`"
                            class="rd-pmc-list__item"
                        >
                            <span class="rd-pmc-list__batch">第{{ index + 1 }}批</span>
                            <span class="rd-pmc-list__date">{{ formatReplyPlanDate(plan.planDate) }}</span>
                            <span class="rd-pmc-list__qty">× {{ plan.deliveryQty }}</span>
                        </div>
                    </div>
                    <span v-else class="rd-pmc-single">{{ currentRow.planArriveDate || '-' }}</span>
                </div>

                <el-divider />

                <!-- 回复类型 -->
                <el-form-item label="回复类型" prop="replyType">
                    <el-radio-group
                        v-model="replyDateForm.replyType"
                        @change="handleReplyTypeChange"
                    >
                        <el-radio :value="1">一次性交货</el-radio>
                        <el-radio :value="2">分批次交货</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 回复计划表格 -->
                <el-form-item label="回复计划">
                    <div class="rd-plan-wrap">
                        <div class="rd-plan-header">
                            <span class="rd-plan-col--batch">批次</span>
                            <span class="rd-plan-col--date">回复日期</span>
                            <span class="rd-plan-col--qty">交货数量</span>
                            <span class="rd-plan-col--act" v-if="replyDateForm.replyType === 2"></span>
                        </div>
                        <div
                            v-for="(item, index) in replyDateForm.replyPlanList"
                            :key="index"
                            class="rd-plan-row"
                        >
                            <span class="rd-plan-col--batch rd-plan-batch-label">第{{ index + 1 }}批</span>
                            <el-date-picker
                                class="rd-plan-col--date"
                                v-model="item.replyDate"
                                type="date"
                                value-format="YYYY-MM-DD"
                                placeholder="选择日期"
                                style="width: 100%"
                            />
                            <el-input-number
                                class="rd-plan-col--qty"
                                v-model="item.deliveryQty"
                                :min="1"
                                :step="1"
                                :step-strictly="true"
                                :precision="0"
                                placeholder="数量"
                                style="width: 100%"
                            />
                            <el-button
                                class="rd-plan-col--act"
                                v-if="replyDateForm.replyType === 2"
                                link
                                type="danger"
                                :disabled="replyDateForm.replyPlanList.length <= 2"
                                @click="removeReplyPlan(index)"
                            >删除</el-button>
                        </div>
                        <div v-if="replyDateForm.replyType === 2" class="rd-plan-add">
                            <el-button link type="primary" @click="addReplyPlan">+ 新增批次</el-button>
                        </div>
                        <div class="rd-plan-footer">
                            <span>计划总量：<strong>{{ planTotal }}</strong></span>
                            <span :class="planTotal === Number(currentRow.quantity || 0) ? 'rd-plan-ok' : 'rd-plan-warn'">
                                {{ planTotal === Number(currentRow.quantity || 0)
                                    ? '✓ 数量已对齐'
                                    : `差 ${Math.max(Number(currentRow.quantity || 0) - planTotal, 0)}`
                                }}
                            </span>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="replyDateDialogVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="replyDateLoading"
                    @click="handleReplyDateSubmit"
                >确认</el-button>
            </template>
        </el-dialog>

        <el-dialog
            v-model="batchLabelDialogVisible"
            title="批次号标签"
            width="1320px"
            destroy-on-close
            class="batch-label-dialog"
        >
            <div v-loading="batchLabelFetching" class="batch-label-dialog__body">
                <div class="batch-label-preview-wrap">
                    <div ref="batchLabelPreviewRef" class="batch-label-sheet">
                        <div class="batch-label-layout">
                            <div class="batch-label-main">
                                <div
                                    v-for="field in batchLabelFields"
                                    :key="field.key"
                                    class="batch-label-row"
                                >
                                    <div class="batch-label-row__label">{{ field.label }}</div>
                                    <div class="batch-label-row__value">
                                        <input
                                            v-model="batchLabelForm[field.key]"
                                            class="batch-label-cell-input"
                                            type="text"
                                            :placeholder="batchLabelPlaceholders[field.key] || ''"
                                            :disabled="!batchLabelEditableFields.has(field.key)"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="batch-label-side">
                                <div class="batch-label-side__title">批次号</div>
                                <div class="batch-label-side__body">
                                    <div class="batch-label-qr-card">
                                        <img
                                            v-if="batchQrDataUrl"
                                            :src="batchQrDataUrl"
                                            alt="批次号二维码"
                                            class="batch-label-qr-card__image"
                                        />
                                        <div v-else class="batch-label-qr-card__placeholder">
                                            请输入批次号
                                        </div>
                                        <div class="batch-label-qr-card__code">
                                            <input
                                                v-if="!batchLabelCapturing"
                                                v-model="batchLabelForm.batchNo"
                                                class="batch-label-qr-card__code-input"
                                                type="text"
                                                placeholder="请输入"
                                                @input="handleBatchNoInput"
                                            />
                                            <div v-else class="batch-label-qr-card__code-export">
                                                {{ batchLabelForm.batchNo }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="batchLabelDialogVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="batchLabelSaving"
                    @click="saveBatchLabel"
                    >保存</el-button
                >
            </template>
        </el-dialog>

    </div>
</template>

<script setup>
import { Filter } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import QRCode from "qrcode";
import {
    DELIVERY_COMPLETED_FILTER,
    getMyPurchaseOrders,
    submitDelivery,
    confirmReplyDate,
    getDeliveryLabel,
    saveDeliveryLabel,
} from "@/api/vendor-delivery";

const defaultQuery = {
    poCode: "",
    invCode: "",
    deliveryStatus: "",
    isCompleted: DELIVERY_COMPLETED_FILTER.PENDING,
    beginTime: "",
    endTime: "",
    p: 1,
    l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const queryParams = reactive({ ...defaultQuery });
const columnFilterVisible = reactive({
    poCode: false,
    invCode: false,
    deliveryStatus: false,
});

// 提交交付相关
const dialogVisible = ref(false);
const submitLoading = ref(false);
const submitFormRef = ref(null);
const currentRow = ref({});
const submitForm = reactive({
    poId: undefined,
    deliveryQty: 1,
    actualDeliveryDate: "",
    remark: "",
});
const submitRules = {
    deliveryQty: [
        { required: true, message: "请输入本次交付数量", trigger: "blur" },
    ],
    actualDeliveryDate: [
        { required: true, message: "请选择实际交付日期", trigger: "change" },
    ],
};

// 回复日期相关
const replyDateDialogVisible = ref(false);
const replyDateLoading = ref(false);
const replyDateFormRef = ref(null);
const replyDateForm = reactive({
    poId: undefined,
    replyType: 1,
    replyPlanList: [{ replyDate: "", deliveryQty: undefined }],
});
const replyDateRules = {
    replyType: [
        { required: true, message: "请选择回复类型", trigger: "change" },
    ],
};

const batchLabelDialogVisible = ref(false);
const batchLabelSaving = ref(false);
const batchLabelFetching = ref(false);
const batchLabelCapturing = ref(false);
const batchLabelPreviewRef = ref(null);
const batchQrDataUrl = ref("");
const BATCH_LABEL_CUSTOMER_NAME = "深圳迪太科技";
const batchLabelForm = reactive({
    poId: undefined,
    batchNo: "",
    supplierName: "",
    customerName: BATCH_LABEL_CUSTOMER_NAME,
    poCode: "",
    invCode: "",
    invName: "",
    specification: "",
    quantity: "",
    model: "",
    date: "",
});
const batchLabelFields = [
    { label: "供应商名称", key: "supplierName" },
    { label: "客户名称", key: "customerName" },
    { label: "采购单号", key: "poCode" },
    { label: "物料编号", key: "invCode" },
    { label: "物料名称", key: "invName" },
    { label: "规格", key: "specification" },
    { label: "数量", key: "quantity" },
    { label: "机型", key: "model" },
    { label: "日期", key: "date" },
];
const batchLabelPlaceholders = {
    quantity: "请输入",
    model: "请输入",
    date: "请输入，如 2026-03-18",
};
const batchLabelEditableFields = new Set(["quantity", "model", "date"]);

const maxQty = computed(() => {
    const val = Number(currentRow.value.remainingQty || 0);
    return val > 0 ? Math.max(1, Math.floor(val)) : 1;
});
const planTotal = computed(() =>
    replyDateForm.replyPlanList.reduce((sum, item) => {
        const qty = Number(item.deliveryQty || 0);
        return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0)
);
function statusType(s) {
    if (s === "已完成") return "success";
    if (s === "部分交付") return "warning";
    return "info";
}

function formatReplyPlanDate(value) {
    if (!value) return "-";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return String(value);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseReplyPlans(row) {
    if (!row?.vendorReplyPlan) return [];
    try {
        const plans = JSON.parse(row.vendorReplyPlan);
        return Array.isArray(plans) ? plans : [];
    } catch {
        return [];
    }
}

function parsePmcPlans(row) {
    if (!row?.pmcPlanJson) return [];
    try {
        const plans = JSON.parse(row.pmcPlanJson);
        return Array.isArray(plans) ? plans : [];
    } catch {
        return [];
    }
}

function parseDeliveryConfirmations(row) {
    const list = row?.deliveryConfirmationList;
    if (!list) return [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") {
        try {
            const parsed = JSON.parse(list);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function getRequestErrorMessage(error, fallback) {
    return error?.response?.data?.msg || error?.message || fallback;
}

function isValidBatchLabelDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function buildBatchLabelDefaults(row) {
    return {
        poId: row?.id,
        batchNo: "",
        supplierName: row?.vendorName || row?.vendorCode || "",
        customerName: BATCH_LABEL_CUSTOMER_NAME,
        poCode: row?.poCode || "",
        invCode: row?.invCode || "",
        invName: row?.invName || row?.inventoryName || "",
        specification: row?.specification || row?.spec || row?.invStd || "",
        quantity: "",
        model: "",
        date: "",
    };
}

function applyBatchLabelDetail(detail = {}, defaults = {}) {
    Object.assign(batchLabelForm, {
        ...defaults,
        supplierName: detail.vendorName || defaults.supplierName || "",
        customerName: BATCH_LABEL_CUSTOMER_NAME,
        poCode: detail.poCode || defaults.poCode || "",
        invCode: detail.invCode || defaults.invCode || "",
        invName: detail.invName || defaults.invName || "",
        specification: detail.specification || defaults.specification || "",
        quantity: detail.labelQuantity ?? defaults.quantity ?? "",
        model: detail.labelModel || defaults.model || "",
        date: detail.labelDate || defaults.date || "",
        batchNo: detail.labelBatchNo || defaults.batchNo || "",
    });
}

async function loadBatchLabelDetail(row, options = {}) {
    const { silent = false } = options;
    const defaults = buildBatchLabelDefaults(row);
    applyBatchLabelDetail({}, defaults);
    batchLabelFetching.value = true;
    try {
        const res = await getDeliveryLabel({ poId: row.id });
        applyBatchLabelDetail(res?.data || {}, defaults);
    } catch (error) {
        if (!silent) {
            ElMessage.warning(
                getRequestErrorMessage(error, "标签信息加载失败，已使用默认数据")
            );
        }
    } finally {
        batchLabelFetching.value = false;
    }
    await nextTick();
    await renderBatchQrCode();
}

async function renderBatchQrCode() {
    const text = (batchLabelForm.batchNo || "").trim();
    if (!text) {
        batchQrDataUrl.value = "";
        return;
    }
    try {
        batchQrDataUrl.value = await QRCode.toDataURL(text, {
            margin: 1,
            width: 320,
        });
    } catch {
        batchQrDataUrl.value = "";
        ElMessage.error("二维码生成失败，请稍后重试");
    }
}

function buildQuery() {
    const params = { ...queryParams };
    if (dateRange.value?.length === 2) {
        params.beginTime = dateRange.value[0];
        params.endTime = dateRange.value[1];
    } else {
        params.beginTime = "";
        params.endTime = "";
    }
    return params;
}

function getList() {
    loading.value = true;
    getMyPurchaseOrders(buildQuery())
        .then((res) => {
            const data = res.data || {};
            tableData.value = data.list || [];
            total.value = Number(data.total || 0);
        })
        .catch((error) => {
            tableData.value = [];
            total.value = 0;
            ElMessage.error(
                error?.message === "Network Error"
                    ? "网络连接失败，请检查后端服务是否可用"
                    : "获取未交订单失败，请稍后重试"
            );
        })
        .finally(() => {
            loading.value = false;
        });
}

function handleQuery() {
    queryParams.p = 1;
    getList();
}

function applyColumnFilter(key) {
    columnFilterVisible[key] = false;
    handleQuery();
}

function resetColumnFilter(key) {
    queryParams[key] = "";
    columnFilterVisible[key] = false;
    handleQuery();
}

function resetQuery() {
    Object.assign(queryParams, defaultQuery);
    dateRange.value = [];
    getList();
}

function openSubmitDialog(row) {
    if (!canSubmitDelivery(row)) {
        ElMessage.warning("当前状态不可提交交付");
        return;
    }
    // 检查是否已填写回复日期
    if (!row.vendorReplyDate) {
        ElMessage.warning("请先回复日期后再提交交付");
        return;
    }
    currentRow.value = row;
    Object.assign(submitForm, {
        poId: row.id,
        deliveryQty: 1,
        actualDeliveryDate: "",
        remark: "",
    });
    dialogVisible.value = true;
}

function openReplyDateDialog(row) {
    currentRow.value = row;
    Object.assign(replyDateForm, {
        poId: row.id,
        replyType: 1,
        replyPlanList: [{ replyDate: "", deliveryQty: undefined }],
    });
    replyDateDialogVisible.value = true;
}

async function openBatchLabelDialog(row) {
    currentRow.value = row;
    batchLabelDialogVisible.value = true;
    await loadBatchLabelDetail(row);
}

function handleBatchNoInput() {
    renderBatchQrCode();
}

function validateBatchLabelForm() {
    if (!batchLabelForm.poId) {
        ElMessage.warning("采购订单行ID不能为空");
        return false;
    }
    if (!String(batchLabelForm.model || "").trim()) {
        ElMessage.warning("机型不能为空");
        return false;
    }
    if (!String(batchLabelForm.date || "").trim()) {
        ElMessage.warning("标签日期不能为空");
        return false;
    }
    if (!isValidBatchLabelDate(String(batchLabelForm.date || "").trim())) {
        ElMessage.warning("标签日期格式不正确，请按 2026-03-18 格式填写");
        return false;
    }
    const qty = Number(batchLabelForm.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
        ElMessage.warning("标签数量必须大于0");
        return false;
    }
    if (!String(batchLabelForm.batchNo || "").trim()) {
        ElMessage.warning("批次号不能为空");
        return false;
    }
    return true;
}

function createEmptyReplyPlan() {
    return { replyDate: "", deliveryQty: undefined };
}

function handleReplyTypeChange(type) {
    if (type === 1) {
        replyDateForm.replyPlanList = [{ replyDate: "", deliveryQty: undefined }];
        return;
    }
    if (replyDateForm.replyPlanList.length < 2) {
        replyDateForm.replyPlanList = [
            { replyDate: "", deliveryQty: undefined },
            { replyDate: "", deliveryQty: undefined },
        ];
    }
}

function addReplyPlan() {
    replyDateForm.replyPlanList.push({ replyDate: "", deliveryQty: undefined });
}

function removeReplyPlan(index) {
    replyDateForm.replyPlanList.splice(index, 1);
}

function handleReplyDateSubmit() {
    replyDateFormRef.value.validate((valid) => {
        if (!valid) return;
        const plans = replyDateForm.replyPlanList.map((item) => ({
            replyDate: item.replyDate,
            deliveryQty: Number(item.deliveryQty),
        }));

        if (
            plans.some(
                (item) => !item.replyDate || !item.deliveryQty || item.deliveryQty <= 0
            )
        ) {
            ElMessage.warning("回复计划中的日期和交货数量不能为空，且交货数量必须大于0");
            return;
        }

        if (replyDateForm.replyType === 1 && plans.length !== 1) {
            ElMessage.warning("一次性交货只能提交一条回复计划");
            return;
        }

        if (replyDateForm.replyType === 2 && plans.length < 2) {
            ElMessage.warning("分批次交货至少提交两条回复计划");
            return;
        }

        const totalQty = plans.reduce((sum, item) => sum + item.deliveryQty, 0);
        const orderedQty = Number(currentRow.value.quantity || 0);
        if (orderedQty > 0 && totalQty > orderedQty) {
            ElMessage.warning("回复计划总数量不能大于采购数量");
            return;
        }

        const sortedPlans = [...plans].sort(
            (a, b) => new Date(a.replyDate).getTime() - new Date(b.replyDate).getTime()
        );

        replyDateLoading.value = true;
        confirmReplyDate({
            poId: replyDateForm.poId,
            replyType: replyDateForm.replyType,
            replyPlanList: sortedPlans,
        })
            .then(() => {
                ElMessage.success("回复计划确认成功");
                replyDateDialogVisible.value = false;
                getList();
            })
            .finally(() => {
                replyDateLoading.value = false;
            });
    });
}

function handleSubmit() {
    submitFormRef.value.validate((valid) => {
        if (!valid) return;
        submitLoading.value = true;
        submitDelivery({ ...submitForm })
            .then(() => {
                ElMessage.success("提交成功");
                dialogVisible.value = false;
                getList();
            })
            .finally(() => {
                submitLoading.value = false;
            });
    });
}

async function saveBatchLabel() {
    if (!validateBatchLabelForm()) {
        return;
    }
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    batchLabelSaving.value = true;
    try {
        await saveDeliveryLabel({
            poId: batchLabelForm.poId,
            labelModel: String(batchLabelForm.model || "").trim(),
            labelDate: String(batchLabelForm.date || "").trim(),
            labelQuantity: Number(batchLabelForm.quantity),
            labelBatchNo: String(batchLabelForm.batchNo || "").trim(),
        });
        if (currentRow.value?.id) {
            await loadBatchLabelDetail(currentRow.value, { silent: true });
        } else {
            await renderBatchQrCode();
        }
        ElMessage.success("标签信息保存成功");
    } catch (error) {
        ElMessage.error(getRequestErrorMessage(error, "标签信息保存失败，请稍后重试"));
    } finally {
        batchLabelSaving.value = false;
    }
}

function canSubmitDelivery(row) {
    return row?.deliveryStatus !== "已完成";
}

onMounted(() => {
    getList();
});
</script>

<style lang="scss" scoped>
.action-stack {
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
}
.pending-qty {
    color: #f56c6c;
    font-weight: 700;
}
.no-date {
    color: #e6a23c;
    font-style: italic;
}
/* ====== 回复日期对话框 - 简洁风格 ====== */

/* 订单信息摘要条 */
.rd-info-bar {
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;
    background: #fafafa;
}
.rd-info-bar__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
    border-right: 1px solid #ebeef5;
}
.rd-info-bar__item:last-child {
    border-right: none;
}
.rd-info-bar__label {
    font-size: 12px;
    color: #909399;
    line-height: 1.2;
}
.rd-info-bar__value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    word-break: break-all;
}
.rd-info-bar__value--warn {
    color: #e6a23c;
}

/* 迪太要求到货日期 */
.rd-section {
    margin-bottom: 4px;
}
.rd-section__title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
}
.rd-pmc-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.rd-pmc-list__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #fff;
    font-size: 13px;
}
.rd-pmc-list__batch {
    color: #909399;
}
.rd-pmc-list__date {
    color: #303133;
    font-weight: 500;
}
.rd-pmc-list__qty {
    color: #409eff;
    font-weight: 600;
}
.rd-pmc-single {
    font-size: 13px;
    color: #606266;
}

/* 回复计划表格 */
.rd-plan-wrap {
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;
}
.rd-plan-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    font-size: 12px;
    font-weight: 600;
    color: #909399;
}
.rd-plan-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
}
.rd-plan-row:last-of-type {
    border-bottom: none;
}
.rd-plan-col--batch {
    width: 56px;
    min-width: 56px;
    text-align: center;
}
.rd-plan-col--date {
    flex: 1 1 0;
    min-width: 140px;
}
.rd-plan-col--qty {
    width: 140px;
    min-width: 140px;
}
.rd-plan-col--act {
    width: 48px;
    min-width: 48px;
    text-align: center;
}
.rd-plan-batch-label {
    font-size: 13px;
    font-weight: 500;
    color: #606266;
}
.rd-plan-add {
    padding: 6px 12px;
    border-bottom: 1px solid #f0f0f0;
}
.rd-plan-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fafafa;
    font-size: 13px;
    color: #606266;
}
.rd-plan-ok {
    color: #67c23a;
    font-weight: 600;
}
.rd-plan-warn {
    color: #e6a23c;
    font-weight: 600;
}

:deep(.reply-plan-dialog .el-dialog) {
    border-radius: 8px;
}
:deep(.reply-plan-dialog .el-dialog__body) {
    padding: 16px 20px;
}
:deep(.reply-plan-dialog .el-dialog__footer) {
    padding: 12px 20px;
}
:deep(.reply-plan-dialog .el-divider) {
    margin: 12px 0;
}
:deep(.reply-plan-dialog .el-date-editor.el-input),
:deep(.reply-plan-dialog .el-input-number) {
    width: 100%;
}
:deep(.batch-label-dialog .el-dialog) {
    border-radius: 12px;
}
:deep(.batch-label-dialog .el-dialog__body) {
    padding: 16px 20px 8px;
}
.batch-label-dialog__body {
    display: flex;
    flex-direction: column;
}
.batch-label-preview-wrap {
    overflow: auto;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 10px;
}
.batch-label-sheet {
    width: 100%;
    max-width: none;
    margin: 0 auto;
    padding: 18px;
    background: #fff;
    box-sizing: border-box;
}
.batch-label-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    align-items: stretch;
}

.batch-label-main {
    border: 2px solid #333;
    border-right: none;
    background: #fff;
}

.batch-label-row {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    min-height: 68px;
}

.batch-label-row + .batch-label-row {
    border-top: 2px solid #333;
}

.batch-label-row__label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    border-right: 2px solid #333;
    background: #efefef;
    color: #2a2a2a;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
}

.batch-label-row__value {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 28px;
    background: #fff;
}

.batch-label-side {
    display: grid;
    grid-template-rows: 68px 1fr;
    border: 2px solid #333;
    background: #fff;
}

.batch-label-side__title {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    border-bottom: 2px solid #333;
    background: #efefef;
    color: #2a2a2a;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-align: center;
}

.batch-label-side__body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding: 12px;
    background: #fff;
    box-sizing: border-box;
}

.batch-label-cell-input {
    width: 100%;
    height: 40px;
    min-height: 40px;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #222;
    font-size: 17px;
    font-weight: 500;
    line-height: 40px;
    letter-spacing: 0.01em;
    font-family: inherit;
    box-sizing: border-box;
}

.batch-label-cell-input:focus {
    background: rgba(64, 158, 255, 0.08);
}
.batch-label-qr-card {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 12px 8px;
    box-sizing: border-box;
}
.batch-label-qr-card__image {
    width: min(100%, 340px);
    height: auto;
    aspect-ratio: 1 / 1;
    object-fit: contain;
}
.batch-label-qr-card__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(100%, 340px);
    aspect-ratio: 1 / 1;
    border: 2px dashed #c0c4cc;
    color: #909399;
    font-size: 15px;
    box-sizing: border-box;
}
.batch-label-qr-card__code {
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 2px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}
.batch-label-qr-card__code-input {
    width: 100%;
    min-height: 48px;
    height: 48px;
    padding: 0 12px;
    border: none;
    outline: none;
    background: transparent;
    color: #222;
    display: block;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    line-height: 48px;
    letter-spacing: 0.01em;
    font-family: inherit;
    box-sizing: border-box;
}

.batch-label-qr-card__code-export {
    width: 100%;
    min-height: 48px;
    height: 48px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #222;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: 0.01em;
    box-sizing: border-box;
    word-break: break-all;
}

.batch-label-qr-card__code-input:focus {
    background: rgba(64, 158, 255, 0.08);
}
.column-filter-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 8px;
    white-space: nowrap;
    flex-wrap: nowrap;
}
.column-filter-trigger > span {
    color: #ffffff;
    line-height: 1;
    white-space: nowrap;
}
.column-filter-trigger__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    min-width: 26px;
    min-height: 26px;
    padding: 4px;
    border-radius: 7px;
    color: rgba(255, 255, 255, 0.96);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
    transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.column-filter-trigger__icon :deep(svg) {
    width: 1em;
    height: 1em;
}
.column-filter-trigger__icon:hover {
    background: rgba(255, 255, 255, 0.28);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
    transform: translateY(-1px);
}
.column-filter-trigger__icon.is-active {
    color: #ffd166;
    background: rgba(255, 209, 102, 0.22);
    box-shadow: inset 0 0 0 1px rgba(255, 209, 102, 0.42);
}
.column-filter-popover {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.column-filter-popover__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}
:deep(.nowrap-cell .cell) {
    white-space: nowrap;
    word-break: normal;
    overflow: hidden;
    text-overflow: ellipsis;
}
/* ====== 表头分区背景色 ====== */
:deep(.hdr-order) {
    background-color: #2980b9 !important;
    color: #fff !important;
}
:deep(.hdr-delivery) {
    background-color: #27ae60 !important;
    color: #fff !important;
}
:deep(.hdr-demand) {
    background-color: #e67e22 !important;
    color: #fff !important;
}
:deep(.hdr-reply) {
    background-color: #8e44ad !important;
    color: #fff !important;
}
:deep(.hdr-action) {
    background-color: #7f8c8d !important;
    color: #fff !important;
}
:deep(.top-align-cell) {
    vertical-align: top !important;
}


:deep(.pmc-plan-inline) {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
}
:deep(.pmc-plan-inline-item) {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 180px;
    font-size: 13px;
    line-height: 1.4;
}
:deep(.pmc-plan-date) {
    color: #303133;
    width: 115px;
    text-align: left;
}
:deep(.pmc-plan-qty) {
    color: #303133;
    font-weight: 500;
    flex: 1;
    text-align: left;
}
:deep(.pmc-plan-single) {
    display: inline-block;
    width: 180px;
    text-align: left;
    color: #303133;
    font-size: 13px;
    line-height: 1.4;
}
:deep(.stat-num) {
    color: #4b4a4a;
}

@media (max-width: 1200px) {
    .batch-label-layout {
        grid-template-columns: minmax(0, 1fr) 360px;
    }

    .batch-label-row {
        grid-template-columns: 220px minmax(0, 1fr);
    }

    .batch-label-row__label,
    .batch-label-side__title {
        font-size: 16px;
    }

    .batch-label-cell-input,
    .batch-label-qr-card__code-input,
    .batch-label-qr-card__code-export {
        font-size: 15px;
    }
}
</style>
