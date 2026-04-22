import path from "path";

const ENV_PRIMARY_ROOT = process.env.ONEDRIVE_PROJECT_ROOT || process.env.ONEDRIVE_ROOT || "";
const ENV_SECONDARY_ROOT =
  process.env.ONEDRIVE_ROOT && process.env.ONEDRIVE_ROOT !== ENV_PRIMARY_ROOT
    ? process.env.ONEDRIVE_ROOT
    : "";

const WORKSPACE_ROOTS = [ENV_PRIMARY_ROOT, ENV_SECONDARY_ROOT].filter(Boolean);

const ABSOLUTE_PATH_REGEX = /^[a-zA-Z]:[\\/]|^\\\\|^file:\/\//;

function normalizeSeparators(input: string): string {
  return input.replace(/\\/g, "/");
}

function trimLeadingSlash(input: string): string {
  return input.replace(/^\/+/, "");
}

export function getWorkspacePrimaryRoot(): string {
  return WORKSPACE_ROOTS[0] || "";
}

export function extractRelativeOneDrivePath(fullPath?: string | null): string {
  if (!fullPath) return "";
  const normalizedFull = normalizeSeparators(fullPath);

  for (const root of WORKSPACE_ROOTS) {
    if (!root) continue;
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

export function resolveAbsoluteOneDrivePath(
  relativePath?: string | null,
  userBasePath?: string | null,
  workspaceRoot: string | null = null
): string {
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
  ].filter((value): value is string => Boolean(value));

  const base = bases[0] || "";
  if (!base) {
    return normalizeSeparators(relativePath || "");
  }

  if (!relativePath) {
    return normalizeSeparators(base);
  }

  const normalizedBase = normalizeSeparators(base).replace(/\/+$/, "");
  const normalizedRelative = trimLeadingSlash(normalizeSeparators(relativePath));
  const joined = path.join(normalizedBase, normalizedRelative);
  return normalizeSeparators(joined);
}

export function hasCustomOneDriveBasePath(
  userBasePath?: string | null,
  workspaceRoot?: string | null
): boolean {
  if (!userBasePath) return false;
  const normalizedUser = normalizeSeparators(userBasePath).toLowerCase();
  const normalizedWorkspace = normalizeSeparators(workspaceRoot || getWorkspacePrimaryRoot()).toLowerCase();
  return !!normalizedUser && normalizedUser !== normalizedWorkspace;
}
