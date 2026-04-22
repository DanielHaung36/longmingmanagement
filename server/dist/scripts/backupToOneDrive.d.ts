/**
 * PostgreSQL 备份上传到 OneDrive
 *
 * 扫描 /backups/ 目录下当天的 .sql.gz 文件，上传到 OneDrive。
 * 用于 K8s CronJob，在每天凌晨本地备份完成后执行。
 *
 * OneDrive 目标路径:
 *   03 Project Management/Database Backups/YYYYMMDD/*.sql.gz
 */
export {};
//# sourceMappingURL=backupToOneDrive.d.ts.map