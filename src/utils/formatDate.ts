/**
 * 格式化日期
 * @param date 日期对象
 * @param fmt 格式化字符串
 * @returns 格式化的日期字符串
 */
export function formatDate(date: Date, fmt: string): string {
  const o: Record<string, number> = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    "S+": date.getMilliseconds(), // 毫秒
  };

  if (/(y+)/.test(fmt)) {
    const year = date.getFullYear().toString();
    fmt = fmt.replace(/(y+)/g, (match) => year.slice(4 - match.length));
  }
  for (const k of Object.keys(o)) {
    if (new RegExp(`(${k})`).test(fmt)) {
      const pad = (n: number) => ("00" + n).slice(-2); // 添加前导零
      fmt = fmt.replace(new RegExp(`(${k})`, "g"), (match) => {
        const num = o[k] as number;
        return match.length === 1 ? num.toString() : pad(num);
      });
    }
  }
  return fmt;
}
