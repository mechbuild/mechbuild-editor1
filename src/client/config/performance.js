// Lazy loading yapılandırması
export const lazyLoadingConfig = {
  threshold: 0.1, // Görünürlük eşiği
  rootMargin: '50px', // Kök kenar boşluğu
  fallback: null, // Yükleme başarısız olduğunda gösterilecek bileşen
  // Ek optimizasyonlar
  preload: true,
  preconnect: [
    'https://api.example.com',
    'https://cdn.example.com'
  ],
  prefetch: [
    '/static/js/vendor.js',
    '/static/css/vendor.css'
  ]
};

// Code splitting yapılandırması
export const codeSplittingConfig = {
  chunks: 'all',
  maxSize: 244 * 1024, // 244KB
  minSize: 20 * 1024, // 20KB
  cacheGroups: {
    vendors: {
      test: /[\\/]node_modules[\\/]/,
      priority: -10,
      reuseExistingChunk: true,
      enforce: true
    },
    common: {
      name: 'common',
      minChunks: 2,
      priority: -20,
      reuseExistingChunk: true
    },
    styles: {
      name: 'styles',
      test: /\.css$/,
      chunks: 'all',
      enforce: true
    }
  },
  // Ek optimizasyonlar
  maxAsyncRequests: 5,
  maxInitialRequests: 3,
  automaticNameDelimiter: '~',
  name: true
};

// Önbellek stratejisi
export const cacheStrategy = {
  staticAssets: {
    maxAge: 31536000, // 1 yıl
    immutable: true,
    staleWhileRevalidate: 86400
  },
  apiResponses: {
    maxAge: 300, // 5 dakika
    staleWhileRevalidate: 60, // 1 dakika
    networkTimeoutSeconds: 10
  },
  // Ek önbellek stratejileri
  runtimeCache: {
    strategy: 'NetworkFirst',
    options: {
      cacheName: 'runtime-cache',
      plugins: [
        {
          cacheWillUpdate: async ({ response }) => {
            if (response.status === 200) {
              return response;
            }
            return null;
          }
        }
      ]
    }
  }
};

// Performans izleme
export const performanceMonitoring = {
  metrics: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'first-input-delay',
    'cumulative-layout-shift',
    'time-to-first-byte',
    'dom-content-loaded',
    'first-meaningful-paint'
  ],
  samplingRate: 0.1, // %10 örnekleme oranı
  reportEndpoint: '/api/performance-metrics',
  // Ek izleme özellikleri
  customMetrics: [
    'custom-metric-1',
    'custom-metric-2'
  ],
  thresholds: {
    fcp: 2000,
    lcp: 2500,
    fid: 100,
    cls: 0.1
  }
};

// Resim optimizasyonu
export const imageOptimization = {
  formats: ['webp', 'avif'],
  quality: 80,
  sizes: [
    { width: 320, suffix: '-sm' },
    { width: 640, suffix: '-md' },
    { width: 1024, suffix: '-lg' }
  ],
  // Ek resim optimizasyonları
  lazyLoading: true,
  placeholder: 'blur',
  blurDataURL: true,
  responsive: true,
  artDirection: [
    {
      media: '(max-width: 768px)',
      width: 768
    },
    {
      media: '(max-width: 1024px)',
      width: 1024
    }
  ]
};

// Bundle analizi
export const bundleAnalysis = {
  enabled: process.env.NODE_ENV === 'development',
  openAnalyzer: true,
  analyzerMode: 'server',
  analyzerPort: 8888,
  // Ek analiz özellikleri
  generateStatsFile: true,
  statsFilename: 'stats.json',
  logLevel: 'info',
  defaultSizes: 'parsed'
};

// Service Worker yapılandırması
export const serviceWorkerConfig = {
  precache: [
    '/',
    '/index.html',
    '/static/js/main.js',
    '/static/css/main.css'
  ],
  runtimeCache: [
    {
      urlPattern: /^https:\/\/api\.example\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10
      }
    }
  ],
  // Ek Service Worker özellikleri
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  offlineFallback: '/offline.html',
  navigationPreload: true
};

// Ek performans optimizasyonları
export const additionalOptimizations = {
  // React optimizasyonları
  react: {
    productionMode: process.env.NODE_ENV === 'production',
    devTools: process.env.NODE_ENV === 'development',
    strictMode: true,
    concurrentFeatures: true
  },
  
  // CSS optimizasyonları
  css: {
    purge: true,
    minify: true,
    sourceMap: process.env.NODE_ENV === 'development',
    modules: true
  },
  
  // JavaScript optimizasyonları
  javascript: {
    minify: true,
    sourceMap: process.env.NODE_ENV === 'development',
    treeShaking: true,
    deadCodeElimination: true
  },
  
  // Asset optimizasyonları
  assets: {
    inlineThreshold: 8192,
    name: '[name].[hash:8].[ext]',
    outputPath: 'static/assets/'
  },
  
  // Build optimizasyonları
  build: {
    parallel: true,
    cache: true,
    hardSource: true,
    progress: true
  }
}; 