export function formatDate(date: Date | string | number, fmt: string = 'yyyy-MM-dd hh:mm:ss'): string {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'string') {
    d = isNaN(Number(date)) ? new Date(date) : new Date(parseInt(date));
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return '';

  // 处理年份
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  }

  // 处理其他部分
  const formatParts = [
    { regex: /(M+)/, value: d.getMonth() + 1 },
    { regex: /(d+)/, value: d.getDate() },
    { regex: /(h+)/, value: d.getHours() },
    { regex: /(m+)/, value: d.getMinutes() },
    { regex: /(s+)/, value: d.getSeconds() },
    { regex: /(q+)/, value: Math.floor((d.getMonth() + 3) / 3) },
    { regex: /(S)/, value: d.getMilliseconds() }
  ];

  formatParts.forEach(({ regex, value }) => {
    if (regex.test(fmt)) {
      fmt = fmt.replace(
        regex,
        RegExp.$1.length === 1 ? value.toString() : ('00' + value).substr(('' + value).length)
      );
    }
  });

  return fmt;
}