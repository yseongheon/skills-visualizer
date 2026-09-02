/**
 * 知识库加载器
 * 负责加载和管理 OpenHarmony Rust API 知识库数据
 * 并维护「向量索引」（mock embedding），支撑混合检索（Hybrid RAG）
 */
import { Scorer } from './scoring'
import { embedEntry, embedQuery, vectorTopK } from './vector-utils'

export class KnowledgeBaseLoader {
  constructor() {
    this.kbData = null
    this.loading = false
    this.vectorIndex = null   // 向量索引：[{ entry, embed }]
    this.indexBuilt = false
  }

  /**
   * 加载知识库数据
   * @returns {Promise<Array>} 知识库数据
   */
  async loadKnowledgeBase() {
    if (this.kbData) return this.kbData

    this.loading = true

    try {
      // 尝试从本地文件加载
      const response = await fetch('/data/knowledge-base.json')
      if (response.ok) {
        this.kbData = await response.json()
        return this.kbData
      }
    } catch (error) {
      console.warn('Failed to load from /data/knowledge-base.json:', error)
    }

    // 如果本地文件加载失败，尝试从相对路径加载
    try {
      const response = await fetch('./data/knowledge-base.json')
      if (response.ok) {
        this.kbData = await response.json()
        return this.kbData
      }
    } catch (error) {
      console.warn('Failed to load from ./data/knowledge-base.json:', error)
    }

    // 如果都失败，返回模拟数据作为后备
    console.warn('Using fallback mock data')
    this.kbData = this.getMockData()
    return this.kbData
  }

  /**
   * 执行搜索（关键词通道，兼容旧接口）
   * @param {string} query - 查询字符串
   * @param {string} buildSystem - 构建系统
   * @param {number} top - 返回数量
   * @returns {Promise<Array>} 搜索结果
   */
  async search(query, buildSystem = 'cargo', top = 8) {
    const entries = await this.loadKnowledgeBase()

    // 使用 Scorer 进行搜索和评分
    const results = Scorer.search(entries, query, buildSystem, top)

    return results
  }

  /**
   * 构建向量索引（模拟「知识库构建」的向量化 + 入库环节）
   * 对全部 685 个条目各生成一个确定性向量并缓存
   * @returns {Promise<Array>} 向量索引 [{ entry, embed }]
   */
  async buildVectorIndex() {
    if (this.vectorIndex) return this.vectorIndex

    const entries = await this.loadKnowledgeBase()

    // 模拟向量化耗时（真实系统为批量 Embedding 调用）
    this.vectorIndex = entries.map(entry => ({
      entry,
      embed: embedEntry(entry)
    }))
    this.indexBuilt = true
    return this.vectorIndex
  }

  /**
   * 获取向量索引信息（供 UI 展示知识库构建结果）
   * @returns {Promise<Object>} 索引描述
   */
  async getIndexInfo() {
    const index = await this.buildVectorIndex()
    const usageChunks = index.reduce((sum, { entry }) => sum + (entry.usage || []).length, 0)
    return {
      totalEntries: index.length,
      vectorDim: (index[0]?.embed || []).length || 64,
      summaryChunks: index.length,
      usageChunks,
      totalChunks: index.length + usageChunks,
      built: true
    }
  }

  /**
   * 混合检索（Hybrid RAG）：关键词通道 + 向量通道 → 融合取 Top-K
   * 注意：检索阶段不按构建系统过滤（构建过滤发生在重排之后），
   * 因此关键词通道使用 buildSystem='any' 保留全部候选
   * @param {string} query - 查询字符串
   * @param {string} buildSystem - 构建系统（仅记录，过滤在 pipeline 后段）
   * @param {number} keywordTop - 关键词通道候选数
   * @param {number} vectorTop - 向量通道候选数
   * @param {number} top - 最终返回数量
   * @returns {Promise<{candidates: Array, channels: Object, vectorResults: Array}>}
   */
  async searchHybrid(query, buildSystem = 'cargo', keywordTop = 30, vectorTop = 15, top = 8) {
    const [entries, index] = await Promise.all([
      this.loadKnowledgeBase(),
      this.buildVectorIndex()
    ])

    // 通道 1：关键词（BM25 风格，不过滤构建系统）
    const keywordResults = Scorer.search(entries, query, 'any', keywordTop)

    // 通道 2：向量相似度召回
    const queryVec = embedQuery(query)
    const vectorResults = vectorTopK(queryVec, index, vectorTop)

    // 融合：并集，保留通道标记
    const channelMap = new Map()
    for (const r of keywordResults) {
      if (!channelMap.has(r.api_name)) channelMap.set(r.api_name, { channels: [], entry: r })
      channelMap.get(r.api_name).channels.push('keyword')
    }
    for (const r of vectorResults) {
      if (!channelMap.has(r.api_name)) {
        // 向量通道独有候选：用 Scorer 快速打分补齐 compactEntry 结构
        const scored = Scorer.scoreEntry(r.entry, Scorer.tokenize(query), {
          summary: 7.0, api: 3.0, source: 1.5, usage: 1.2
        })
        channelMap.set(r.api_name, {
          channels: [],
          entry: Scorer.compactEntry(r.entry, scored.score || 0, scored.details || {})
        })
      }
      channelMap.get(r.api_name).channels.push('vector')
    }

    // 融合排序：关键词分（已有）为主，向量相似度作为并列微调
    const candidates = [...channelMap.values()].map(({ entry, channels }) => {
      const vecHit = vectorResults.find(v => v.api_name === entry.api_name)
      return {
        ...entry,
        channels: [...new Set(channels)],
        recallVectorSim: vecHit ? vecHit.sim : 0
      }
    })
    // 排序：关键词分高者优先；纯向量命中的用相似度换算
    candidates.sort((a, b) => {
      const aScore = a.score || a.recallVectorSim * 30
      const bScore = b.score || b.recallVectorSim * 30
      return bScore - aScore
    })

    return {
      candidates: candidates.slice(0, top),
      vectorResults,
      totalKeyword: keywordResults.length,
      totalVector: vectorResults.length,
      queryTokens: Scorer.tokenize(query)
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    const data = await this.loadKnowledgeBase()

    return {
      totalApis: data.length,
      sourceDistribution: this.calculateDistribution(data, 'source.source_kind'),
      qualityDistribution: this.calculateQualityDistribution(data),
      usageDistribution: this.calculateUsageDistribution(data)
    }
  }

  /**
   * 计算分布
   * @param {Array} data - 数据
   * @param {string} field - 字段路径
   * @returns {Object} 分布信息
   */
  calculateDistribution(data, field) {
    const distribution = {}

    data.forEach(item => {
      let value

      if (field === 'source.source_kind') {
        value = item.source?.source_kind
      } else {
        value = item[field]
      }

      if (value !== undefined) {
        distribution[value] = (distribution[value] || 0) + 1
      }
    })

    return distribution
  }

  /**
   * 计算质量分布
   * @param {Array} data - 数据
   * @returns {Object} 质量分布
   */
  calculateQualityDistribution(data) {
    const qualityCount = {
      production: 0,
      test: 0,
      example: 0,
      documentation: 0,
      synthetic: 0
    }

    data.forEach(item => {
      const usageList = item.usage || []
      usageList.forEach(usage => {
        const quality = String(usage.quality || '')
        if (qualityCount.hasOwnProperty(quality)) {
          qualityCount[quality]++
        }
      })
    })

    return qualityCount
  }

  /**
   * 计算使用分布
   * @param {Array} data - 数据
   * @returns {Object} 使用分布
   */
  calculateUsageDistribution(data) {
    const distribution = {
      hasUsage: 0,
      noUsage: 0
    }

    data.forEach(item => {
      if (item.usage && item.usage.length > 0) {
        distribution.hasUsage++
      } else {
        distribution.noUsage++
      }
    })

    return distribution
  }

  /**
   * 获取模拟数据（用于测试）
   * @returns {Array} 模拟数据
   */
  getMockData() {
    return [
      {
        api_name: "ohos::message_parcel::MessageParcel",
        api_source_type: "openharmony_builtin",
        function_summary: "MessageParcel is a type for message parcel; it appears in OpenHarmony Rust code as a reusable data structure, enum, error type, or builder/input type.",
        score: 0.856,
        score_details: {
          summary: 0.856,
          api: 0.428,
          source: 0.214,
          usage: 0.171
        },
        build_support: {
          cargo_supported: true,
          cargo_dependency: "ohos-message-parcel = \"0.1.0\"",
          openharmony_gn_supported: true,
          openharmony_gn_targets: ["//foundation/abilitybase/message_parcel:lib"]
        },
        usage: [
          {
            quality: "production",
            file: "applications/sample/src/main.rs",
            line: 45,
            code: "let parcel = MessageParcel::new();"
          },
          {
            quality: "production",
            file: "foundation/abilitybase/message_parcel/src/lib.rs",
            line: 123,
            code: "pub fn write_interface_token(&mut self, token: &str) -> Result<()>;"
          }
        ]
      }
    ]
  }
}