/**
 * User-Agent 解析工具
 * @description 从请求头 user-agent 中提取浏览器类型和操作系统，用于登录日志记录
 *
 * @使用示例
 * ```ts
 * const { browser, os } = parseUserAgent(req.headers['user-agent'] || '');
 * ```
 */

interface UserAgentInfo {
  browser: string;
  os: string;
}

/**
 * 解析 user-agent 字符串，提取浏览器和操作系统
 * @param ua user-agent 字符串
 * @returns { browser, os } 浏览器类型和操作系统
 */
export function parseUserAgent(ua: string): UserAgentInfo {
  return {
    browser: detectBrowser(ua),
    os: detectOs(ua),
  };
}

/** 识别浏览器类型（取主流浏览器，未知返回 Unknown） */
function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'IE';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Unknown';
}

/** 识别操作系统（取主流系统，未知返回 Unknown） */
function detectOs(ua: string): string {
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/i.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/i.test(ua)) return 'Windows 7';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}
