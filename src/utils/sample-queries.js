/**
 * 示例查询数据
 * 用于演示和测试搜索功能
 */
export const sampleQueries = [
  {
    id: 'query-1',
    title: '消息处理',
    query: 'message parcel write interface token',
    description: '查找消息相关的 API，特别是 MessageParcel 和接口写入功能',
    keywords: ['message', 'parcel', 'interface', 'token'],
    expectedResults: ['MessageParcel', 'ParcelWriter', 'InterfaceToken']
  },
  {
    id: 'query-2',
    title: 'JSON 序列化',
    query: 'json serialize deserialize',
    description: '查找 JSON 序列化和反序列化的 API 实现',
    keywords: ['json', 'serialize', 'deserialize'],
    expectedResults: ['JsonSerializer', 'JsonParser', 'JsonEncoder']
  },
  {
    id: 'query-3',
    title: '文件操作',
    query: 'file read write buffer',
    description: '查找文件读写和缓冲区操作的 API',
    keywords: ['file', 'read', 'write', 'buffer'],
    expectedResults: ['FileReader', 'FileWriter', 'BufferManager']
  },
  {
    id: 'query-4',
    title: '错误处理',
    query: 'error handling result',
    description: '查找错误处理和结果返回的相关 API',
    keywords: ['error', 'result', 'handler'],
    expectedResults: ['Result', 'ErrorHandler', 'TryCatch']
  },
  {
    id: 'query-5',
    title: '网络通信',
    query: 'http request response',
    description: '查找 HTTP 网络请求和响应的 API',
    keywords: ['http', 'request', 'response', 'client'],
    expectedResults: ['HttpClient', 'RequestBuilder', 'ResponseParser']
  },
  {
    id: 'query-6',
    title: '线程同步',
    query: 'thread mutex lock',
    description: '查找线程和同步原语的 API',
    keywords: ['thread', 'mutex', 'lock', 'sync'],
    expectedResults: ['Thread', 'Mutex', 'Semaphore']
  }
]

/**
 * 查询历史记录
 */
export const queryHistory = [
  {
    query: 'message parcel',
    timestamp: Date.now() - 60000,
    results: 8,
    bestScore: 0.95,
    buildSystem: 'cargo'
  },
  {
    query: 'json serialize',
    timestamp: Date.now() - 120000,
    results: 6,
    bestScore: 0.92,
    buildSystem: 'cargo'
  },
  {
    query: 'file read write',
    timestamp: Date.now() - 180000,
    results: 4,
    bestScore: 0.88,
    buildSystem: 'openharmony_gn'
  }
]

/**
 * 评分演示数据
 */
export const scoreDemo = {
  query: 'message parcel write interface token',
  stages: [
    {
      stage: 'query',
      description: '原始查询处理',
      duration: '100ms',
      actions: ['分词', '提取关键词']
    },
    {
      stage: 'retrieve',
      description: '知识库检索',
      duration: '350ms',
      actions: ['向量搜索', 'Top-K 检索'],
      results: {
        searched: 685,
        matched: 24,
        retrieved: 8
      }
    },
    {
      stage: 'score',
      description: '评分排序',
      duration: '150ms',
      actions: ['关键词匹配', '质量评分', '来源加权'],
      scoringFactors: {
        keywordMatch: 0.85,
        qualityScore: 0.92,
        sourceWeight: 0.78,
        buildCompatibility: 1.0
      }
    },
    {
      stage: 'filter',
      description: '过滤筛选',
      duration: '50ms',
      actions: ['构建系统检查', '兼容性过滤'],
      filteredResults: 8
    },
    {
      stage: 'generate',
      description: '生成结果',
      duration: '200ms',
      actions: ['结果排序', '格式化输出']
    }
  ],
  finalResults: [
    {
      api_name: 'ohos::message_parcel::MessageParcel',
      score: 0.95,
      source: 'module_rust_api',
      quality: 'production',
      matches: ['message', 'parcel', 'interface']
    },
    {
      api_name: 'ohos::parcel::ParcelWriter',
      score: 0.87,
      source: 'ffi_wrapper',
      quality: 'test',
      matches: ['parcel', 'write']
    },
    {
      api_name: 'ohos::interface_token::InterfaceToken',
      score: 0.82,
      source: 'openharmony_builtin',
      quality: 'documentation',
      matches: ['interface', 'token']
    }
  ]
}