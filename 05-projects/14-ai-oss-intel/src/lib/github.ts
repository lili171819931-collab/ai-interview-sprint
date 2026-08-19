/**
 * GitHub 链接安全助手：fullName 含空格等非法字符时回退到 GitHub 搜索（保证按钮始终可打开真实项目）。
 */
export function githubRepoUrl(fullName: string): string {
  if (/^[\w.-]+\/[\w.-]+$/.test(fullName)) return `https://github.com/${fullName}`;
  return `https://github.com/search?q=${encodeURIComponent(fullName.replace("/", " "))}&type=repositories`;
}
