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
                />
            </el-form-item>
            <el-form-item label="请购单号">
                <el-input
                    v-model="queryParams.appCode"
                    placeholder="请输入请购单号"
                    clearable
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
                    prop="rowNo"
                    label="行号"
                    width="70"
                    align="center"
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
                    label="已交付数量"
                    min-width="110"
                    align="center"
                />
                <el-table-column
                    prop="remainingQty"
                    label="待确认数量"
                    min-width="110"
                    align="center"
                >
                    <template #default="{ row }">
                        <span class="pending-qty">{{ row.remainingQty }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="planArriveDate"
                    label="计划到货日期"
                    min-width="130"
                    align="center"
                />
                <el-table-column
                    prop="vendorReplyDate"
                    label="供应商回复日期"
                    min-width="130"
                    align="center"
                >
                    <template #default="{ row }">
                        <span :class="{ 'no-date': !row.vendorReplyDate }">{{
                            row.vendorReplyDate || "-"
                        }}</span>
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
                            v-else
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
                        :precision="2"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="实际交付日期" prop="actualDeliveryDate">
                    <el-date-picker
                        v-model="submitForm.actualDeliveryDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input
                        v-model="submitForm.remark"
                        type="textarea"
                        :rows="3"
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
            title="供应商回复日期确认"
            width="480px"
            destroy-on-close
        >
            <el-form
                ref="replyDateFormRef"
                :model="replyDateForm"
                :rules="replyDateRules"
                label-width="120px"
            >
                <el-form-item label="采购订单号">
                    <el-input :model-value="currentRow.poCode" disabled />
                </el-form-item>
                <el-form-item label="存货编码">
                    <el-input :model-value="currentRow.invCode" disabled />
                </el-form-item>
                <el-form-item label="计划到货日期">
                    <el-input
                        :model-value="currentRow.planArriveDate"
                        disabled
                    />
                </el-form-item>
                <el-form-item label="回复日期" prop="replyDate">
                    <el-date-picker
                        v-model="replyDateForm.replyDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="请选择回复日期"
                        style="width: 100%"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="replyDateDialogVisible = false"
                    >取消</el-button
                >
                <el-button
                    type="primary"
                    :loading="replyDateLoading"
                    @click="handleReplyDateSubmit"
                    >确认</el-button
                >
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
    l: 10,
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
    replyDate: "",
});
const replyDateRules = {
    replyDate: [
        { required: true, message: "请选择回复日期", trigger: "change" },
    ],
};

const maxQty = computed(() => {
    const val = Number(currentRow.value.remainingQty || 0);
    return val > 0 ? val : 1;
});

function statusType(s) {
    if (s === "已完成") return "success";
    if (s === "部分交付") return "warning";
    return "info";
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
    // 模拟数据
    const mockData = [
        {
            id: 1,
            poCode: "PO20260201001",
            rowNo: 1,
            invCode: "INV-001",
            quantity: 1000,
            deliveredQty: 600,
            remainingQty: 400,
            planArriveDate: "2026-03-15",
            vendorReplyDate: "2026-03-10",
            deliveryStatus: "部分交付",
        },
        {
            id: 2,
            poCode: "PO20260201001",
            rowNo: 2,
            invCode: "INV-002",
            quantity: 500,
            deliveredQty: 0,
            remainingQty: 500,
            planArriveDate: "2026-03-20",
            vendorReplyDate: "",
            deliveryStatus: "未交付",
        },
        {
            id: 3,
            poCode: "PO20260201002",
            rowNo: 1,
            invCode: "INV-003",
            quantity: 2000,
            deliveredQty: 2000,
            remainingQty: 0,
            planArriveDate: "2026-02-28",
            vendorReplyDate: "2026-02-20",
            deliveryStatus: "已完成",
        },
        {
            id: 4,
            poCode: "PO20260201003",
            rowNo: 1,
            invCode: "INV-004",
            quantity: 800,
            deliveredQty: 300,
            remainingQty: 500,
            planArriveDate: "2026-03-10",
            vendorReplyDate: "",
            deliveryStatus: "部分交付",
        },
        {
            id: 5,
            poCode: "PO20260201003",
            rowNo: 2,
            invCode: "INV-005",
            quantity: 1500,
            deliveredQty: 0,
            remainingQty: 1500,
            planArriveDate: "2026-03-25",
            vendorReplyDate: "2026-03-18",
            deliveryStatus: "未交付",
        },
        {
            id: 6,
            poCode: "PO20260201004",
            rowNo: 1,
            invCode: "INV-006",
            quantity: 300,
            deliveredQty: 300,
            remainingQty: 0,
            planArriveDate: "2026-02-20",
            vendorReplyDate: "2026-02-15",
            deliveryStatus: "已完成",
        },
    ];

    tableData.value = mockData;
    total.value = mockData.length;
    loading.value = false;

    // 实际API调用 (注释掉)
    // loading.value = true;
    // getMyPurchaseOrders(buildQuery())
    //   .then((res) => {
    //     const data = res.data || {};
    //     tableData.value = data.list || [];
    //     total.value = Number(data.total || 0);
    //   })
    //   .finally(() => {
    //     loading.value = false;
    //   });
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
        replyDate: "",
    });
    replyDateDialogVisible.value = true;
}

function handleReplyDateSubmit() {
    replyDateFormRef.value.validate((valid) => {
        if (!valid) return;
        replyDateLoading.value = true;
        confirmReplyDate({ ...replyDateForm })
            .then(() => {
                ElMessage.success("回复日期确认成功");
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
</style>
