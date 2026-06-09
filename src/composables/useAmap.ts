let _loadPromise: Promise<any> | null = null;

export function loadAmap(): Promise<any> {
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((resolve, reject) => {
    if ((window as any).AMap) { resolve((window as any).AMap); return; }

    const key         = import.meta.env.VITE_AMAP_KEY         || '';
    const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY || '';

    if (!key) { reject(new Error('未配置高德地图 Key (VITE_AMAP_KEY)')); return; }

    if (securityKey) {
      (window as any)._AMapSecurityConfig = { securityJsCode: securityKey };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder,AMap.Marker,AMap.Geolocation`;
    script.onload  = () => resolve((window as any).AMap);
    script.onerror = () => { _loadPromise = null; reject(new Error('高德地图脚本加载失败')); };
    document.head.appendChild(script);
  });

  return _loadPromise;
}
