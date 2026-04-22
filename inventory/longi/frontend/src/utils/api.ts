// // src/utils/api.ts
//
// import type { InventoryRow } from "../features/inventory/components/InventoryModel.ts";
//
// /**
//  * 模拟后台接口：获取库存列表
//  * 如果对接真实后端，把此处改为 fetch('/api/inventory') 等
//  */
// export async function fetchInventory(): Promise<InventoryRow[]> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       // 从 pages/makeData.ts 中导入 mockData
//       import("../features/inventory/makeData.ts").then((module) => {
//         resolve(module.data as InventoryRow[]);
//       });
//     }, 200);
//   });
// }
//
// /**
//  * 模拟后台接口：创建一条新库存
//  * @param newItem - 待创建的库存项（不含 id、createdAt、last_update）
//  */
// export async function createInventoryItem(
//   newItem: Omit<InventoryRow, "id" | "createdAt" | "last_update">
// ): Promise<InventoryRow> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         ...newItem,
//         id: Date.now().toString(),
//         createdAt: new Date().toISOString(),
//         last_update: new Date().toISOString(),
//       });
//     }, 200);
//   });
// }
//
// /**
//  * 模拟后台接口：更新库存
//  * @param id - 要更新的库存 id
//  * @param updates - 部分字段更新
//  */
// export async function updateInventoryItem(
//   id: string,
//   updates: Partial<InventoryRow>
// ): Promise<Partial<InventoryRow>> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         ...updates,
//         last_update: new Date().toISOString(),
//       });
//     }, 200);
//   });
// }
//
// /**
//  * 模拟后台接口：删除库存
//  * @param id - 要删除的库存 id
//  */
// export async function deleteInventoryItem(id: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(true);
//     }, 200);
//   });
// }
