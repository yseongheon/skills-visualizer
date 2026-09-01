/**
 * 知识库加载器
 * 负责加载和管理 OpenHarmony Rust API 知识库数据
 */
import { Scorer } from './scoring'

export class KnowledgeBaseLoader {
  constructor() {
    this.kbData = null
    this.loading = false
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
   * 执行搜索
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