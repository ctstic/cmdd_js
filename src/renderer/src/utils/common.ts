// 哈希算法
export function fnv1a(str: string): string {
  let hash = 0xcbf29ce484222325n // 64-bit offset basis
  const prime = 0x100000001b3n // 64-bit prime
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i))
    hash *= prime
  }
  return (hash & BigInt('0xFFFFFFFFFFFFFFFF')).toString(16)
}
