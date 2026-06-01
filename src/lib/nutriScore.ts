import type { Nutrition } from '../types'

function p(v: string | undefined): number {
  const n = parseFloat(v?.replace(',', '.') || '')
  return isNaN(n) ? -1 : n
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function pointsEnergy(kcal: number): number {
  const thresholds = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
  return thresholds.findIndex(t => kcal <= t * 4.184) + 1 // convert kcal to kJ
  // simplified: treat kcal as direct proxy
}

function pointsLinear(value: number, thresholds: number[]): number {
  if (value <= thresholds[0]) return 0
  for (let i = 1; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i
  }
  return thresholds.length
}

export function calcNutriScore(nutrition: Nutrition): { grade: string; score: number } | null {
  const kcal = p(nutrition.p100['kcal'])
  const sugars = p(nutrition.p100['sugars'])
  const satFat = p(nutrition.p100['sat_fat'])
  const sodium = p(nutrition.p100['sodium'])
  const fiber = p(nutrition.p100['fibers'])
  const protein = p(nutrition.p100['prot'])

  if (kcal < 0 && sugars < 0 && satFat < 0 && sodium < 0) return null

  const energy = kcal >= 0 ? pointsLinear(kcal * 4.184, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]) : 0
  const sug = sugars >= 0 ? pointsLinear(sugars, [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]) : 0
  const sat = satFat >= 0 ? pointsLinear(satFat, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) : 0
  const sod = sodium >= 0 ? pointsLinear(sodium, [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]) : 0
  const fib = fiber >= 0 ? pointsLinear(fiber, [0.7, 1.4, 2.1, 2.8, 3.5]) : 0
  const prot = protein >= 0 ? pointsLinear(protein, [1.6, 3.2, 4.8, 6.4, 8.0]) : 0

  const N = energy + sug + sat + sod
  const P = fib + prot
  const score = N - P

  let grade: string
  if (score <= -1) grade = 'A'
  else if (score <= 2) grade = 'B'
  else if (score <= 10) grade = 'C'
  else if (score <= 18) grade = 'D'
  else grade = 'E'

  return { grade, score }
}

export const nutriScoreColors: Record<string, string> = {
  A: 'bg-emerald-500 text-white',
  B: 'bg-green-400 text-white',
  C: 'bg-yellow-400 text-white',
  D: 'bg-orange-400 text-white',
  E: 'bg-red-500 text-white',
}
