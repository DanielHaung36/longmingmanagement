// 统一的 Part Group 选项
// 用于产品分类和库存筛选

export const PART_GROUPS = [
  "Sensors",
  "Valves",
  "PowerTransmission",
  "Electronics",
  "Mechanical",
  "Other"
] as const;

export type PartGroup = typeof PART_GROUPS[number];
