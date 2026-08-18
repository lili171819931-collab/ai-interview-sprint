/**
 * Open-source license policy — every project displayed on the platform must
 * be open source (OSI-approved or common open licenses). Live GitHub repos
 * are filtered here; seed projects are filtered at export time.
 */
export const OPEN_SOURCE_LICENSES = new Set([
  "mit",
  "apache-2.0",
  "apache-2",
  "gpl-3.0",
  "gpl-3",
  "gpl-2.0",
  "gpl-2",
  "agpl-3.0",
  "agpl-3",
  "lgpl-2.1",
  "lgpl-3.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "bsd-4-clause",
  "mpl-2.0",
  "mpl-2",
  "unlicense",
  "cc0-1.0",
  "isc",
  "postgresql",
  "zlib",
  "artistic-2.0",
  "epl-2.0",
  "cddl-1.0",
  "0bsd",
  "wtfpl",
  "ofl-1.1",
  "cc-by-4.0",
]);

const OPEN_SOURCE_NAMES = new Set([
  "MIT", "Apache-2.0", "GPL-3.0", "GPL-2.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0",
  "BSD-2-Clause", "BSD-3-Clause", "MPL-2.0", "Unlicense", "CC0-1.0", "ISC",
  "PostgreSQL", "Zlib", "Artistic-2.0", "EPL-2.0", "CDDL-1.0", "0BSD", "WTFPL", "CC-BY-4.0",
]);

export function isOpenSourceLicense(license?: string | null): boolean {
  if (!license) return false;
  const id = license.toLowerCase().trim();
  if (OPEN_SOURCE_LICENSES.has(id)) return true;
  if (OPEN_SOURCE_NAMES.has(license.trim())) return true;
  return false;
}

/** GitHub Search qualifier fragment: only OSI/common open-source licenses. */
export const LICENSE_QUALIFIER =
  "(license:mit OR license:apache-2.0 OR license:gpl-3.0 OR license:agpl-3.0 OR license:bsd-3-clause OR license:mpl-2.0 OR license:unlicense OR license:cc0-1.0)";
