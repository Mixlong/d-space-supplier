<template>
    <div class="app-container delivery-page">
        <search-bar
            :model="queryParams"
            @search="handleQuery"
            @reset="resetQuery"
        >
            <el-form-item label="采购订单号">
                <el-input
                    v-model="queryParams.poCode"
                    placeholder="请输入采购订单号"
                    clearable
                    style="width: 200px"
                />
            </el-form-item>
            <el-form-item label="请购单号">
                <el-input
                    v-model="queryParams.appCode"
                    placeholder="请输入请购单号"
                    clearable
                    style="width: 200px"
                />
            </el-form-item>
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
                <el-table-column
                    prop="poCode"
                    label="采购订单号"
                    min-width="160"
                />
                <el-table-column
                    prop="invCode"
                    label="物料编码"
                    min-width="130"
                />
                <el-table-column
                    prop="quantity"
                    label="采购数量"
                    min-width="100"
                    align="center"
                />
                <el-table-column
                    prop="deliveredQty"
                    label="供应商已送数量"
                    min-width="110"
                    align="center"
                />
                <el-table-column
                    prop="remainingQty"
                    label="待交付数量"
                    min-width="110"
                    align="center"
                >
                    <template #default="{ row }">
                        <span class="pending-qty">{{ row.remainingQty }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="storageQty"
                    label="迪太已入库数量"
                    min-width="110"
                    align="center"
                >
                    <template #default="{ row }">
                        <span>{{ row.storageQty || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="planArriveDate"
                    label="迪太要求到货日期"
                    min-width="220"
                    align="center"
                >
                    <template #default="{ row }">
                        <div v-if="row.pmcPlanType === 2 && parsePmcPlans(row).length > 0" class="pmc-plan-inline">
                            <div
                                v-for="(plan, index) in parsePmcPlans(row)"
                                :key="`pmc-${row.id}-${index}`"
                                class="pmc-plan-inline-item"
                            >
                                <span class="pmc-plan-date">{{ formatReplyPlanDate(plan.planDate) }}</span>
                                <span class="pmc-plan-qty">（ {{ plan.deliveryQty }}）</span>
                            </div>
                        </div>
                        <span v-else-if="row.planArriveDate">{{ row.planArriveDate }}</span>
                        <span v-else class="no-date">-</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="vendorReplyDate"
                    label="供应商回复日期"
                    min-width="220"
                    align="center"
                >
                    <template #default="{ row }">
                        <span v-if="!row.vendorReplyDate" class="no-date">-</span>
                        <div v-else-if="row.vendorReplyType === 2 && parseReplyPlans(row).length > 0" class="pmc-plan-inline">
                            <div
                                v-for="(plan, index) in parseReplyPlans(row)"
                                :key="`reply-${row.id}-${index}`"
                                class="pmc-plan-inline-item"
                            >
                                <span class="pmc-plan-date">{{ formatReplyPlanDate(plan.replyDate) }}</span>
                                <span class="pmc-plan-qty">（{{ plan.deliveryQty }}）</span>
                            </div>
                        </div>
                        <span v-else>{{ row.vendorReplyDate }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="deliveryStatus"
                    label="交付状态"
                    min-width="100"
                    align="center"
                >
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
                >
                    <template #default="{ row }">
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

    </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import {
    getMyPurchaseOrders,
    submitDelivery,
    confirmReplyDate,
} from "@/api/vendor-delivery";

const defaultQuery = {
    poCode: "",
    appCode: "",
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

function canSubmitDelivery(row) {
    return row?.deliveryStatus !== "已完成";
}

onMounted(() => {
    getList();
});
</script>

<style lang="scss" scoped>
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
</style>
