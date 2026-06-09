import rawData from 'china-area-data/data.json';

interface AreaNode {
  label: string;
  value: string;
  children?: AreaNode[];
}

const data = rawData as Record<string, Record<string, string>>;

function buildTree(): AreaNode[] {
  const provinces = data['86'] || {};
  return Object.entries(provinces).map(([pCode, pName]) => {
    const cities = data[pCode] || {};
    const cityNodes: AreaNode[] = Object.entries(cities).map(([cCode, cName]) => {
      const districts = data[cCode] || {};
      const districtNodes: AreaNode[] = Object.entries(districts).map(([, dName]) => ({
        label: dName,
        value: dName,
      }));
      return {
        label: cName,
        value: cName,
        children: districtNodes.length ? districtNodes : undefined,
      };
    });
    return {
      label: pName,
      value: pName,
      children: cityNodes.length ? cityNodes : undefined,
    };
  });
}

let _cache: AreaNode[] | null = null;

export function getAreaTree(): AreaNode[] {
  if (!_cache) _cache = buildTree();
  return _cache;
}
