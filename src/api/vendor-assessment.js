import request from "@/utils/request";

export function getVendorAssessmentYearly(params) {
  return request({
    url: "/vendor/assessment/yearly",
    method: "get",
    params,
  });
}

export function getAdminVendorAssessmentYearly(params) {
  return request({
    url: "/base/vendor/assessment/yearly",
    method: "get",
    params,
  });
}

export function batchSaveVendorAssessmentScore(data) {
  return request({
    url: "/base/vendor/assessment/score/batchSave",
    method: "put",
    data,
  });
}

export function saveVendorAssessmentConclusion(data) {
  return request({
    url: "/base/vendor/assessment/conclusion/save",
    method: "put",
    data,
  });
}
