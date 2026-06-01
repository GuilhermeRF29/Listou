const unitPattern = /(\d+[\.,]?\d*)\s*(kg|g|mg|l|ml|m|cm|mm|un|unidade|unidades)/i

export function calcUnitPrice(price: number, size: string): { value: number; unit: string } | null {
  const match = size.match(unitPattern)
  if (!match || price <= 0) return null

  let qty = parseFloat(match[1].replace(',', '.'))
  let unit = match[2].toLowerCase()

  if (unit === 'g' || unit === 'mg') {
    if (unit === 'mg') qty /= 1000
    if (unit === 'g') qty /= 1000
    unit = 'kg'
  } else if (unit === 'ml') {
    qty /= 1000
    unit = 'L'
  } else if (unit === 'cm') {
    qty /= 100
    unit = 'm'
  }

  if (qty <= 0) return null

  return { value: price / qty, unit }
}

export function formatUnitPrice(price: number, size: string): string {
  const result = calcUnitPrice(price, size)
  if (!result) return ''
  return `R$ ${result.value.toFixed(2)}/${result.unit}`
}
