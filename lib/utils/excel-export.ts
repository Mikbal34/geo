import * as XLSX from 'xlsx'
import { ScoreOverall, ScoreLLM } from '@/types/llm'
import { Brand } from '@/types/brand'

interface ExportData {
  brand: Brand
  overallScore: ScoreOverall | null
  llmScores: ScoreLLM[]
  historicalData: any[]
  competitorScores: any[]
  timeFilter: string
  selectedLLMs: string[]
}

/**
 * Export Dashboard data to Excel with 4 sheets
 */
export function exportDashboardToExcel(data: ExportData) {
  const {
    brand,
    overallScore,
    llmScores,
    historicalData,
    competitorScores,
    timeFilter,
    selectedLLMs
  } = data

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Get formatted filter labels
  const timeFilterLabel = getTimeFilterLabel(timeFilter)
  const llmFilterLabel = getLLMFilterLabel(selectedLLMs)
  const exportDate = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // ===== SHEET 1: Summary (Özet) =====
  const summaryData = [
    ['DASHBOARD EXPORT - ÖZET'],
    [],
    ['Marka:', brand.brand_name],
    ['Domain:', brand.domain],
    ['Bölge:', brand.region || '-'],
    ['Export Tarihi:', exportDate],
    ['Zaman Filtresi:', timeFilterLabel],
    ['LLM Filtresi:', llmFilterLabel],
    [],
    ['KEY METRICS'],
    [],
    ['Metrik', 'Değer'],
    ['Visibility', overallScore ? `${Math.round(overallScore.visibility_pct)}%` : '-'],
    ['Sentiment', overallScore ? `${Math.round(overallScore.sentiment_pct)}%` : '-'],
    ['Avg Position', overallScore?.avg_position_raw ? overallScore.avg_position_raw.toFixed(1) : '-'],
    ['Mentions', overallScore?.mentions_raw_total || 0]
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)

  // Format Summary sheet
  ws1['!cols'] = [{ wch: 20 }, { wch: 40 }]

  // Bold headers
  if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 14 } }
  if (ws1['A10']) ws1['A10'].s = { font: { bold: true, sz: 12 } }
  if (ws1['A12']) ws1['A12'].s = { font: { bold: true } }
  if (ws1['B12']) ws1['B12'].s = { font: { bold: true } }

  XLSX.utils.book_append_sheet(wb, ws1, 'Özet')

  // ===== SHEET 2: Historical Trends (Tarihsel Trendler) =====
  const historicalHeaders = ['Tarih', 'Visibility %', 'Sentiment %', 'Position', 'Mentions']
  const historicalRows = (historicalData || []).map(item => [
    new Date(item.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    Math.round(item.visibility_pct || 0),
    Math.round(item.sentiment_pct || 0),
    item.avg_position_raw ? item.avg_position_raw.toFixed(1) : '-',
    item.mentions_raw_total || item.mentions_raw || 0
  ])

  const ws2Data = [historicalHeaders, ...historicalRows]
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data)

  if (ws2 && ws2['!cols']) {
    ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
  } else if (ws2) {
    ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
  }

  // Bold header row - extra safe
  if (ws2) {
    try {
      ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(cell => {
        if (ws2[cell]) {
          ws2[cell].s = { font: { bold: true } }
        }
      })
    } catch (e) {
      // Silently ignore formatting errors
    }
  }

  if (ws2) {
    XLSX.utils.book_append_sheet(wb, ws2, 'Tarihsel Trendler')
  }

  // ===== SHEET 3: Industry Ranking (Sektör Sıralaması) =====
  // Add brand first, then competitors, sorted by visibility
  const allBrands = [
    {
      name: brand.brand_name,
      visibility: overallScore?.visibility_pct || 0,
      sentiment: overallScore?.sentiment_pct || 0,
      position: overallScore?.avg_position_raw || null,
      mentions: overallScore?.mentions_raw_total || 0,
      isBrand: true
    },
    ...(competitorScores || []).map((comp: any) => ({
      name: comp.competitor_name,
      visibility: comp.visibility_pct || 0,
      sentiment: comp.sentiment_pct || 0,
      position: comp.avg_position || null,
      mentions: comp.mentions_total || 0,
      isBrand: false
    }))
  ].sort((a, b) => b.visibility - a.visibility)

  const rankingHeaders = ['Sıra', 'Marka', 'Visibility %', 'Sentiment %', 'Position', 'Mentions']
  const rankingRows = allBrands.map((item, index) => [
    index + 1,
    item.name,
    Math.round(item.visibility),
    Math.round(item.sentiment),
    item.position ? item.position.toFixed(1) : '-',
    item.mentions
  ])

  const ws3Data = [rankingHeaders, ...rankingRows]
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data)

  if (ws3) {
    ws3['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]

    // Bold header row
    try {
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'].forEach(cell => {
        if (ws3[cell]) {
          ws3[cell].s = { font: { bold: true } }
        }
      })
    } catch (e) {
      // Silently ignore formatting errors
    }
  }

  if (ws3) {
    XLSX.utils.book_append_sheet(wb, ws3, 'Sektör Sıralaması')
  }

  // ===== SHEET 4: LLM Breakdown (LLM Detayları) =====
  // Group by analysis_run_id to show each analysis with its LLM scores
  const llmByAnalysis = new Map<string, any[]>()

  ;(historicalData || []).forEach(analysisRun => {
    if (!llmByAnalysis.has(analysisRun.id)) {
      llmByAnalysis.set(analysisRun.id, [])
    }
  })

  // Add LLM scores grouped by their analysis_run_id
  ;(llmScores || []).forEach(llmScore => {
    const analysisId = llmScore.analysis_run_id
    if (analysisId && llmByAnalysis.has(analysisId)) {
      llmByAnalysis.get(analysisId)!.push(llmScore)
    }
  })

  const llmHeaders = ['Tarih', 'LLM', 'Visibility %', 'Sentiment %', 'Position', 'Mentions']
  const llmRows: any[] = []

  // Create rows for each analysis run
  ;(historicalData || []).forEach(analysisRun => {
    const llmScoresForRun = llmByAnalysis.get(analysisRun.id) || []
    const dateStr = new Date(analysisRun.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // If we have LLM scores for this run, show them
    if (llmScoresForRun.length > 0) {
      llmScoresForRun.forEach(llmScore => {
        llmRows.push([
          dateStr,
          llmScore.llm.toUpperCase(),
          Math.round(llmScore.visibility_pct || 0),
          Math.round(llmScore.sentiment_pct || 0),
          llmScore.avg_position_raw ? llmScore.avg_position_raw.toFixed(1) : '-',
          llmScore.mentions_raw || 0
        ])
      })
    } else {
      // No LLM breakdown available, show overall
      llmRows.push([
        dateStr,
        'Overall',
        Math.round(analysisRun.visibility_pct || 0),
        Math.round(analysisRun.sentiment_pct || 0),
        analysisRun.avg_position_raw ? analysisRun.avg_position_raw.toFixed(1) : '-',
        analysisRun.mentions_raw_total || 0
      ])
    }
  })

  const ws4 = XLSX.utils.aoa_to_sheet([llmHeaders, ...llmRows])

  if (ws4) {
    ws4['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]

    // Bold header row
    try {
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'].forEach(cell => {
        if (ws4[cell]) ws4[cell].s = { font: { bold: true } }
      })
    } catch (e) {
      // Silently ignore formatting errors
    }
  }

  if (ws4) {
    XLSX.utils.book_append_sheet(wb, ws4, 'LLM Detayları')
  }

  // Generate filename
  const filename = `Dashboard_${brand.brand_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

  // Export file
  XLSX.writeFile(wb, filename)
}

// Helper functions
function getTimeFilterLabel(filter: string): string {
  switch (filter) {
    case '24h': return '24 Saat'
    case '7d': return '7 Gün'
    case '30d': return '1 Ay'
    case 'custom': return 'Özel Tarih Aralığı'
    default: return 'Tüm Zamanlar'
  }
}

function getLLMFilterLabel(llms: string[]): string {
  if (llms.length === 0 || llms.length === 3) {
    return 'Tüm LLM\'ler (ChatGPT, Gemini, Perplexity)'
  }
  if (llms.length === 1) {
    const llm = llms[0]
    return llm === 'chatgpt' ? 'ChatGPT' : llm === 'gemini' ? 'Gemini' : 'Perplexity'
  }
  return llms.map(llm =>
    llm === 'chatgpt' ? 'ChatGPT' : llm === 'gemini' ? 'Gemini' : 'Perplexity'
  ).join(', ')
}
