/**
 * 评分算法实现
 * 与 search_openharmony_rust_api_kb.py 中的算法保持一致
 */
export class Scorer {
  /**
   * 质量权重配置
   */
  static get QUALITY_WEIGHT() {
    return {
      production: 5.0,
      test: 3.0,
      example: 2.0,
      documentation: 1.5,
      crate_source: 1.2,
      synthetic: 0.5
    }
  }

  /**
   * 来源类型权重配置
   */
  static get SOURCE_KIND_WEIGHT() {
    return {
      module_rust_api: 2.0,
      openharmony_builtin: 1.8,
      ffi_wrapper: 1.5,
      third_party_crate: 1.0
    }
  }

  /**
   * 分词函数
   * @param {string} text - 输入文本
   * @returns {Array<string>} 分词结果
   */
  static tokenize(text) {
    if (!text) return []

    return text
      .toLowerCase()
      .split(/[^A-Za-z0-9_]+/)
      .filter(t => t.length >= 2)
  }

  /**
   * 获取字段的文本内容
   * @param {Object} entry - API 条目
   * @param {string} field - 字段名
   * @returns {string} 字段文本
   */
  static textForField(entry, field) {
    if (field === 'summary') {
      return String(entry.function_summary || '')
    }
    if (field === 'api') {
      return String(entry.api_name || '')
    }
    if (field === 'source') {
      const source = entry.source || {}
      return `${source.name || ''} ${source.local_path || ''} ${source.source_kind || ''}`
    }
    if (field === 'usage') {
      return (entry.usage || []).map(u => String(u.code || '')).join(' ')
    }
    return ''
  }

  /**
   * 计算使用质量得分
   * @param {Object} entry - API 条目
   * @returns {number} 质量得分
   */
  static usageScore(entry) {
    const usageList = entry.usage || []
    let best = 0.0

    for (const usage of usageList) {
      const quality = String(usage.quality || '')
      const weight = this.QUALITY_WEIGHT[quality] || 0.0
      if (weight > best) {
        best = weight
      }
    }

    return best
  }

  /**
   * 计算来源得分
   * @param {Object} entry - API 条目
   * @returns {number} 来源得分
   */
  static sourceScore(entry) {
    const source = entry.source || {}
    const sourceKind = String(source.source_kind || '')
    return this.SOURCE_KIND_WEIGHT[sourceKind] || 0.0
  }

  /**
   * 计算 API 条目的得分
   * @param {Object} entry - API 条目
   * @param {Array<string>} queryTokens - 查询词
   * @param {Object} fieldWeights - 字段权重
   * @returns {Object} 得分详情
   */
  static scoreEntry(entry, queryTokens, fieldWeights) {
    const details = {}

    if (!queryTokens || queryTokens.length === 0) {
      return { score: 0, details }
    }

    let total = 0.0

    // 计算每个字段的得分
    for (const [field, weight] of Object.entries(fieldWeights)) {
      const text = this.textForField(entry, field)
      if (!text) continue

      const fieldTokens = this.tokenize(text)
      if (!fieldTokens || fieldTokens.length === 0) continue

      // 计算字段得分
      let fieldScore = 0.0
      for (const queryToken of queryTokens) {
        // 精确匹配
        if (fieldTokens.includes(queryToken)) {
          fieldScore += 1.0 + Math.log1p(fieldTokens.filter(t => t === queryToken).length)
        }
        // 部分匹配（如 IPC/ipc）
        else {
          const partialMatches = fieldTokens.filter(token =>
            queryToken.includes(token) || token.includes(queryToken)
          )
          if (partialMatches.length > 0) {
            fieldScore += 0.35 * partialMatches.length
          }
        }
      }

      if (fieldScore > 0) {
        details[field] = fieldScore * weight
        total += details[field]
      }
    }

    // 添加质量和来源得分
    if (total > 0) {
      details.usage_quality = this.usageScore(entry)
      details.source_kind = this.sourceScore(entry)
      total += details.usage_quality + details.source_kind
    }

    return {
      score: total,
      details: details
    }
  }

  /**
   * 检查构建支持
   * @param {Object} entry - API 条目
   * @param {string} buildSystem - 构建系统
   * @returns {boolean} 是否支持
   */
  static buildSupported(entry, buildSystem) {
    if (buildSystem === 'any') {
      return true
    }

    const buildSupport = entry.build_support || {}

    if (buildSystem === 'cargo') {
      return Boolean(buildSupport.cargo?.supported)
    }

    if (buildSystem === 'openharmony_gn') {
      return Boolean(buildSupport.openharmony_gn?.supported)
    }

    return false
  }

  /**
   * 压缩条目，只保留必要字段
   * @param {Object} entry - 原始条目
   * @param {number} score - 得分
   * @param {Object} details - 得分详情
   * @returns {Object} 压缩后的条目
   */
  static compactEntry(entry, score, details) {
    const usage = entry.usage || []

    // 获取质量最高的使用证据
    const bestUsage = usage
      .slice()
      .sort((a, b) => {
        const weightA = this.QUALITY_WEIGHT[String(a.quality || '')] || 0.0
        const weightB = this.QUALITY_WEIGHT[String(b.quality || '')] || 0.0
        return weightB - weightA
      })
      .slice(0, 3)

    const source = entry.source || {}

    return {
      score: Math.round(score * 1000) / 1000,
      score_details: Object.fromEntries(
        Object.entries(details).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
      ),
      api_name: entry.api_name || '',
      api_source_type: entry.api_source_type || '',
      function_summary: entry.function_summary || '',
      source: {
        name: source.name || '',
        local_path: source.local_path || '',
        source_kind: source.source_kind || ''
      },
      build_support: this.summarizeBuild(entry),
      usage: bestUsage
    }
  }

  /**
   * 汇总构建信息
   * @param {Object} entry - API 条目
   * @returns {Object} 汇总信息
   */
  static summarizeBuild(entry) {
    const build = entry.build_support || {}
    const cargo = build.cargo || {}
    const gn = build.openharmony_gn || {}

    return {
      cargo_supported: Boolean(cargo.supported),
      cargo_dependency: cargo.dependencies_toml || cargo.local_path_dependency || '',
      openharmony_gn_supported: Boolean(gn.supported),
      openharmony_gn_targets: gn.build_targets || []
    }
  }

  /**
   * 检查条目是否有使用证据
   * @param {Object} entry - API 条目
   * @returns {boolean} 是否有使用证据
   */
  static hasUsageEvidence(entry) {
    const usage = entry.usage || []
    return usage.length > 0
  }

  /**
   * 获取条目的最高质量等级
   * @param {Object} entry - API 条目
   * @returns {string} 最高质量等级
   */
  static getBestQuality(entry) {
    const usage = entry.usage || []
    const bestUsage = usage
      .slice()
      .sort((a, b) => {
        const weightA = this.QUALITY_WEIGHT[String(a.quality || '')] || 0.0
        const weightB = this.QUALITY_WEIGHT[String(b.quality || '')] || 0.0
        return weightB - weightA
      })

    return bestUsage[0]?.quality || 'synthetic'
  }

  /**
   * 获取条目的来源类型
   * @param {Object} entry - API 条目
   * @returns {string} 来源类型
   */
  static getSourceKind(entry) {
    const source = entry.source || {}
    return source.source_kind || 'synthetic'
  }

  /**
   * 执行搜索
   * @param {Array<Object>} entries - API 条目列表
   * @param {string} query - 查询字符串
   * @param {string} buildSystem - 构建系统
   * @param {number} top - 返回数量
   * @param {Object} fieldWeights - 字段权重
   * @returns {Array<Object>} 搜索结果
   */
  static search(entries, query, buildSystem = 'cargo', top = 8, fieldWeights = null) {
    if (!fieldWeights) {
      fieldWeights = {
        summary: 7.0,
        api: 3.0,
        source: 1.5,
        usage: 1.2
      }
    }

    const queryTokens = this.tokenize(query)
    const scored = []

    // 评分和过滤
    for (const entry of entries) {
      if (!this.buildSupported(entry, buildSystem)) {
        continue
      }

      const result = this.scoreEntry(entry, queryTokens, fieldWeights)
      if (result.score > 0) {
        scored.push({
          entry,
          score: result.score,
          details: result.details
        })
      }
    }

    // 排序并取前 N 个
    scored.sort((a, b) => b.score - a.score)

    const results = scored
      .slice(0, top)
      .map(({ entry, score, details }) =>
        this.compactEntry(entry, score, details)
      )

    return results
  }
}