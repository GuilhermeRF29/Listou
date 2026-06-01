import ExcelJS from 'exceljs'
import { calcUnitPrice } from './unitPrice'
import type { Item, CatalogItem, HistoryEntry } from '../types'

const HEADER_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' }
const BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 28
  row.eachCell(c => {
    c.fill = HEADER_FILL as ExcelJS.Fill
    c.font = HEADER_FONT as ExcelJS.Font
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    c.border = { bottom: { style: 'medium', color: { argb: 'FF059669' } } }
  })
}

function addDataRow(ws: ExcelJS.Worksheet, values: (string | number)[], formats?: Record<number, Partial<ExcelJS.Font>>) {
  const row = ws.addRow(values)
  row.eachCell((c, col) => {
    c.border = BORDER as ExcelJS.Borders
    c.alignment = { vertical: 'middle', horizontal: typeof values[col - 1] === 'number' ? 'right' : 'left' }
    if (formats?.[col]) Object.assign(c.font, formats[col])
  })
  return row
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w })
}

export async function exportExcel(data: {
  activeItems: Item[]
  catalog: CatalogItem[]
  history: HistoryEntry[]
}) {
  const wb = new ExcelJS.Workbook()

  wb.creator = 'Listou'
  wb.created = new Date()

  const dateStr = new Date().toISOString().slice(0, 10)

  // ── Sheet 1: Lista Ativa ──
  const ws1 = wb.addWorksheet('Lista Ativa')
  setColWidths(ws1, [30, 18, 12, 8, 10, 12, 16, 14])
  styleHeader(ws1.addRow(['Produto', 'Marca', 'Tamanho', 'Qtd', 'Preço Unit.', 'Total', 'Mercado', 'Categoria']))

  for (const item of data.activeItems) {
    const total = item.price * item.quantity
    addDataRow(ws1, [
      (item.checked ? '✅ ' : '⬜ ') + item.name,
      item.brand || '',
      item.size || '',
      item.quantity,
      item.price || 0,
      total,
      item.store || '',
      item.category || '',
    ])
  }

  // ── Sheet 2: Catálogo ──
  const ws2 = wb.addWorksheet('Catálogo')
  setColWidths(ws2, [30, 18, 14, 12, 14, 16, 12, 14])
  styleHeader(ws2.addRow(['Produto', 'Marca', 'Tipo', 'Tamanho', 'Categoria', 'Mercado', 'Últ. Preço', 'Preço Unitário']))

  for (const item of data.catalog) {
    const up = calcUnitPrice(item.lastPrice, item.size)
    addDataRow(ws2, [
      item.name,
      item.brand || '',
      item.type || '',
      item.size || '',
      item.category || '',
      item.store || '',
      item.lastPrice || 0,
      up ? `R$ ${up.value.toFixed(2)}/${up.unit}` : '',
    ])
  }

  // ── Sheet 3: Histórico ──
  const ws3 = wb.addWorksheet('Histórico')
  setColWidths(ws3, [14, 30, 18, 12, 10, 12, 12, 16])
  styleHeader(ws3.addRow(['Data', 'Produto', 'Marca', 'Qtd', 'Preço', 'Total Item', 'Mercado', 'Total Compra']))

  for (const entry of data.history) {
    const dateLabel = new Date(entry.date).toLocaleDateString('pt-BR')
    const firstRow = addDataRow(ws3, [
      dateLabel,
      entry.items[0]?.name || '',
      entry.items[0]?.brand || '',
      entry.items[0]?.quantity || 0,
      entry.items[0]?.price || 0,
      (entry.items[0]?.price || 0) * (entry.items[0]?.quantity || 0),
      entry.items[0]?.store || '',
      entry.total,
    ], { 8: { bold: true } as Partial<ExcelJS.Font> })

    if (entry.items[0]) {
      ws3.mergeCells(`A${firstRow.number}:A${firstRow.number + entry.items.length - 1}`)
      ws3.mergeCells(`H${firstRow.number}:H${firstRow.number + entry.items.length - 1}`)
      firstRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
      firstRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'right' }
    }

    for (let i = 1; i < entry.items.length; i++) {
      const item = entry.items[i]
      addDataRow(ws3, [
        '',
        item.name || '',
        item.brand || '',
        item.quantity || 0,
        item.price || 0,
        (item.price || 0) * (item.quantity || 0),
        item.store || '',
        '',
      ])
    }
  }

  // ── Download ──
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `listou_${dateStr}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
