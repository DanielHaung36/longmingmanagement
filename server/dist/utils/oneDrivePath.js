"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspacePrimaryRoot = getWorkspacePrimaryRoot;
exports.extractRelativeOneDrivePath = extractRelativeOneDrivePath;
exports.resolveAbsoluteOneDrivePath = resolveAbsoluteOneDrivePath;
exports.hasCustomOneDriveBasePath = hasCustomOneDriveBasePath;
const path_1 = __importDefault(require("path"));
const ENV_PRIMARY_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || process.env.ONEDRIVE_ROOT || "";
const ENV_SECONDARY_ROOT = process.env.ONEDRIVE_ROOT && process.env.ONEDRIVE_ROOT !== ENV_PRIMARY_ROOT
    ? process.env.ONEDRIVE_ROOT
    : "";
const WORKSPACE_ROOTS = [ENV_PRIMARY_ROOT, ENV_SECONDARY_ROOT].filter(Boolean);
const ABSOLUTE_PATH_REGEX = /^[a-zA-Z]:[\\/]|^\\\\|^file:\/\//;
function normalizeSeparators(input) {
    return input.replace(/\\/g, "/");
}
function trimLeadingSlash(input) {
    return input.replace(/^\/+/, "");
}
function getWorkspacePrimaryRoot() {
    return WORKSPACE_ROOTS[0] || "";
}
function extractRelativeOneDrivePath(fullPath) {
    if (!fullPath)
        return "";
    const normalizedFull = normalizeSeparators(fullPath);
    for (const root of WORKSPACE_ROOTS) {
        if (!root)
            continue;
        const normalizedRoot = normalizeSeparators(root);
        const rootWithSlash = normalizedRoot.endsWith("/")
            ? normalizedRoot
            : `${normalizedRoot}/`;
        if (normalizedFull.toLowerCase().startsWith(rootWithSlash.toLowerCase())) {
            const sliced = normalizedFull.slice(rootWithSlash.length);
            return trimLeadingSlash(sliced);
        }
        if (normalizedFull.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
            const sliced = normalizedFull.slice(normalizedRoot.length);
            return trimLeadingSlash(sliced);
        }
    }
    return trimLeadingSlash(normalizedFull);
}
function resolveAbsoluteOneDrivePath(relativePath, userBasePath, workspaceRoot = null) {
    if (relativePath) {
        const normalizedCandidate = normalizeSeparators(relativePath);
        if (ABSOLUTE_PATH_REGEX.test(normalizedCandidate)) {
            return normalizedCandidate;
        }
    }
    const bases = [
        userBasePath,
        workspaceRoot,
        ...WORKSPACE_ROOTS,
    ].filter((value) => Boolean(value));
    const base = bases[0] || "";
    if (!base) {
        return normalizeSeparators(relativePath || "");
    }
    if (!relativePath) {
        return normalizeSeparators(base);
    }
    const normalizedBase = normalizeSeparators(base).replace(/\/+$/, "");
    const normalizedRelative = trimLeadingSlash(normalizeSeparators(relativePath));
    const joined = path_1.default.join(normalizedBase, normalizedRelative);
    return normalizeSeparators(joined);
}
function hasCustomOneDriveBasePath(userBasePath, workspaceRoot) {
    if (!userBasePath)
        return false;
    const normalizedUser = normalizeSeparators(userBasePath).toLowerCase();
    const normalizedWorkspace = normalizeSeparators(workspaceRoot || getWorkspacePrimaryRoot()).toLowerCase();
    return !!normalizedUser && normalizedUser !== normalizedWorkspace;
}
//# sourceMappingURL=oneDrivePath.js.map