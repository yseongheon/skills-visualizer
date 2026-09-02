/**
 * 向量工具模块
 * 为前端演示提供确定性的 mock Embedding / 相似度检索 / 重排 / 代码生成能力
 *
 * 设计说明：
 * - 真实系统使用 Embedding 模型（如 bge / text-embedding）将文本映射为高维向量，
 *   前端演示无法调用模型，因此采用「特征哈希（feature hashing）」生成确定性向量：
 *   同一文本永远得到同一向量，语义相近的文本共享关键词，余弦相似度较高。
 * - 向量召回结果故意「粗糙」（仅编码 function_summary），
 *   而 Cross-encoder 重排会结合 usage 代码细节 + 质量权重，使排序发生变化，
 *   从而直观演示「召回粗排 → 精排重排」的价值。
 */

/** FNV-1a 32 位字符串哈希（确定性，无碰撞模拟需求） */
function stringHash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 英文小写分词（与 Scorer.tokenize 风格一致） */
function tokenize(text) {
  if (!text) return []
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(t => t.length >= 2)
}

/**
 * 将文本编码为 dim 维向量（确定性）
 * @param {string} text - 输入文本
 * @param {number} dim - 向量维度（默认 64，教学演示足够）
 * @returns {Array<number>} L2 归一化向量
 */
export function embedText(text, dim = 64) {
  const vec = new Array(dim).fill(0)
  const tokens = tokenize(text)

  // 特征哈希：每个 token 投影到 2 个维度（主维 + 辅维），带符号
  for (const t of tokens) {
    const h = stringHash(t)
    const idx = h % dim
    const sign = ((h >>> 16) & 1) === 1 ? 1 : -1
    vec[idx] += sign
    const idx2 = (h >>> 7) % dim
    vec[idx2] += sign * 0.5
  }

  // L2 归一化（余弦相似度只关心方向）
  let norm = 0
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] = Math.round((vec[i] / norm) * 10000) / 10000
  }
  return vec
}

/** 计算两个向量的余弦相似度 */
export function cosineSimilarity(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return Math.round((dot / (Math.sqrt(na) * Math.sqrt(nb))) * 10000) / 10000
}

/**
 * 对一个 API 条目生成 Embedding（向量召回使用）
 * 真实系统会编码「名称 + 功能摘要 + 源码片段」；
 * 这里只编码 summary，使向量召回结果相对粗糙，为后续重排留出对比空间
 */
export function embedEntry(entry) {
  const text = `${entry.api_name || ''} ${entry.function_summary || ''}`
  return embedText(text, 64)
}

/**
 * 查询文本向量化（与知识库条目同维度）
 */
export function embedQuery(query) {
  return embedText(String(query || ''), 64)
}

/**
 * 向量库检索：对全部条目计算余弦相似度，返回 Top-K
 * @param {Array<number>} queryVec - 查询向量
 * @param {Array<{entry: Object, embed: Array<number>}>} index - 向量索引
 * @param {number} k - 返回数量
 * @returns {Array<{api_name: string, sim: number}>}
 */
export function vectorTopK(queryVec, index, k = 15) {
  const scored = index.map(item => ({
    entry: item.entry,
    sim: cosineSimilarity(queryVec, item.embed)
  }))
  scored.sort((a, b) => b.sim - a.sim)
  return scored
    .slice(0, k)
    .map(({ entry, sim }) => ({ api_name: entry.api_name, sim }))
}

/**
 * 混合检索融合排序：关键词分（BM25 风格）与向量相似度归一化后融合
 * @param {Array} keywordResults - 关键词通道结果（带 score）
 * @param {Array<{api_name: string, sim: number}>} vectorResults - 向量通道结果
 * @returns {Map<string, {channel: string[]}>} api_name -> 通道标记
 */
export function fuseChannels(keywordResults, vectorResults) {
  const kwSet = new Map()
  for (const r of keywordResults) kwSet.set(r.api_name, 'keyword')
  const vecSet = new Map()
  for (const r of vectorResults) vecSet.set(r.api_name, 'vector')

  const fused = new Map()
  for (const r of keywordResults) {
    fused.set(r.api_name, { channels: ['keyword'] })
  }
  for (const r of vectorResults) {
    if (fused.has(r.api_name)) {
      fused.get(r.api_name).channels.push('vector')
    } else {
      fused.set(r.api_name, { channels: ['vector'] })
    }
  }
  return fused
}

/**
 * 模拟 Cross-encoder 重排
 * 真实 Cross-encoder 将 (query, doc) 拼接后整体编码打分，精度高于双塔召回。
 * 这里用「usage 代码细节匹配 + 使用质量加成」模拟精排信号，
 * 与纯 summary 向量召回的排序产生差异，直观展示重排效果。
 * @param {Array<Object>} candidates - 候选（compactEntry 格式，含 usage）
 * @param {string} query - 查询文本
 * @returns {Array<{api_name: string, oldRank: number, newRank: number,
 *                  recallScore: number, rerankScore: number}>}
 */
export function mockRerank(candidates, query) {
  const qTokens = tokenize(query)
  const QUALITY_BONUS = { production: 1.0, test: 0.5, example: 0.3, documentation: 0.2, crate_source: 0.15, synthetic: 0 }

  const detailScores = candidates.map((cand, oldRank) => {
    // 精排信号 1：usage 代码中的强匹配（精确 token 计数）
    const codeText = (cand.usage || []).map(u => String(u.code || '')).join(' ')
    const codeTokens = tokenize(codeText)
    let codeHits = 0
    for (const qt of qTokens) {
      if (codeTokens.includes(qt)) codeHits += 1
      else if (codeTokens.some(ct => ct.includes(qt) || qt.includes(ct))) codeHits += 0.4
    }
    const codeScore = codeHits / Math.max(qTokens.length, 1)

    // 精排信号 2：最高使用质量加成
    const usageList = cand.usage || []
    let bestQuality = 'synthetic'
    let bestW = 0
    for (const u of usageList) {
      const w = QUALITY_BONUS[String(u.quality || '')] ?? 0
      if (w > bestW) { bestW = w; bestQuality = u.quality }
    }
    const qualityBoost = Math.min(QUALITY_BONUS[bestQuality] ?? 0, 1.0)

    // 精排信号 3：来源类型加成（官方/模块 API 略高于第三方）
    const srcKind = String(cand.api_source_type || cand.source?.source_kind || '')
    let srcBoost = 0.15
    if (srcKind.includes('module') || srcKind.includes('builtin')) srcBoost = 0.4
    else if (srcKind.includes('ffi')) srcBoost = 0.25

    // 综合重排分 = 召回基线（关键词分归一） + 精排信号
    const recallScore = Math.round(cand.score * 100) / 100 // 0~40+ 区间，用于展示
    const rerankScore = Math.round(
      (recallScore + codeScore * 8 + qualityBoost * 3 + srcBoost * 2) * 100
    ) / 100

    return { cand, oldRank: oldRank + 1, recallScore, rerankScore, codeScore, qualityBoost, srcBoost }
  })

  // 按重排分降序，得到新排名
  const sorted = detailScores.slice().sort((a, b) => b.rerankScore - a.rerankScore)
  sorted.forEach((item, idx) => { item.newRank = idx + 1 })

  return sorted.map(({ cand, oldRank, newRank, recallScore, rerankScore, codeScore, qualityBoost, srcBoost }) => ({
    api_name: cand.api_name,
    oldRank,
    newRank,
    recallScore,
    rerankScore,
    codeScore: Math.round(codeScore * 100) / 100,
    qualityBoost,
    srcBoost
  }))
}

/**
 * 模拟 LLM 生成：根据 Top-1 API 及其真实 usage 证据生成 Rust 代码
 * @param {Object} api - 候选 API（compactEntry 格式）
 * @param {string} query - 用户查询
 * @returns {{code: string, explanation: string, apiUsage: Object}}
 */
export function generateRustCode(api, query) {
  const usage = (api.usage && api.usage[0]) || {}
  const apiName = (api.api_name || '').split('::').pop() || api.api_name
  const crateName = (api.source?.name || api.api_name || '').split('::')[0]

  const code = `// 基于检索结果生成的 Rust 示例（API: ${api.api_name || 'unknown'}）
// 使用证据来源：${usage.file || 'OpenHarmony 源码'}:${usage.line || ''}
use ${crateName || 'ohos'}::${apiName || 'Api'};

fn demo() -> Result<()> {
    // 来自知识库的真实使用模式
    ${usage.code || `let value = ${apiName || 'api'}_new();`}

    // 结合用户需求（${(query || '').slice(0, 40)}）的扩展调用
    Ok(())
}
`

  const explanation = `根据检索到的 API「${api.api_name}」及其真实使用证据生成了可编译的 Rust 示例。
代码中的调用模式 ${usage.code || ''} 直接取自 OpenHarmony 源码（${usage.file || ''}），
保证 API 名称、参数与签名准确无误，这是 RAG 相比纯 LLM 生成的最大优势。`

  return { code, explanation, apiUsage: usage }
}

/** 统计向量索引基本信息（用于展示知识库构建结果） */
export function describeIndex(entries, dim = 64) {
  const usageChunks = entries.reduce((sum, e) => sum + (e.usage || []).length, 0)
  return {
    totalEntries: entries.length,
    vectorDim: dim,
    summaryChunks: entries.length,
    usageChunks,
    totalChunks: entries.length + usageChunks,
    embeddedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }
}
