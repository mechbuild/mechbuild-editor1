const { Pool } = require('pg');
const logger = require('../utils/logger');

// Veritabanı bağlantı havuzu yapılandırması
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mechbuild_editor2',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20, // Maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // Boşta kalan bağlantıların kapatılma süresi
  connectionTimeoutMillis: 2000, // Bağlantı zaman aşımı
  statement_timeout: 5000, // Sorgu zaman aşımı
  query_timeout: 5000, // Toplam sorgu zaman aşımı
  application_name: 'mechbuild-editor2',
  // Ek optimizasyonlar
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  allowExitOnIdle: true,
  maxUses: 7500, // Her bağlantı maksimum kullanım sayısı
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Bağlantı havuzu olayları
pool.on('connect', (client) => {
  logger.debug('Yeni veritabanı bağlantısı oluşturuldu');
  // Her yeni bağlantıda performans ayarları
  client.query('SET statement_timeout = 5000');
  client.query('SET idle_in_transaction_session_timeout = 10000');
  client.query('SET lock_timeout = 5000');
});

pool.on('error', (err) => {
  logger.error('Veritabanı bağlantı hatası:', err);
});

// Sorgu optimizasyonu için yardımcı fonksiyonlar
const query = async (text, params) => {
  const start = Date.now();
  try {
    // Prepared statement kullanımı
    const res = await pool.query({
      text,
      values: params,
      rowMode: 'array', // Daha hızlı sonuç dönüşü
      types: {
        getTypeParser: () => (val) => val // Tip dönüşümlerini devre dışı bırak
      }
    });
    
    const duration = Date.now() - start;
    logger.debug('Sorgu çalıştırıldı', { 
      text, 
      duration, 
      rows: res.rowCount,
      plan: res.rows[0]?.explain // Sorgu planı
    });
    
    return res;
  } catch (err) {
    logger.error('Sorgu hatası:', { text, params, error: err.message });
    throw err;
  }
};

// Sık kullanılan sorgular için önbellek
const queryCache = new Map();
const queryStats = new Map(); // Sorgu istatistikleri

const cachedQuery = async (key, text, params, ttl = 300000) => {
  const cacheKey = `${key}:${JSON.stringify(params)}`;
  const cached = queryCache.get(cacheKey);
  
  // Sorgu istatistiklerini güncelle
  const stats = queryStats.get(key) || { hits: 0, misses: 0, avgTime: 0 };
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    stats.hits++;
    queryStats.set(key, stats);
    return cached.result;
  }

  const start = Date.now();
  const result = await query(text, params);
  const duration = Date.now() - start;
  
  stats.misses++;
  stats.avgTime = (stats.avgTime * (stats.hits + stats.misses - 1) + duration) / (stats.hits + stats.misses);
  queryStats.set(key, stats);
  
  queryCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });

  return result;
};

// Veritabanı indeksleri
const createIndexes = async () => {
  try {
    await query(`
      -- Mevcut indeksler
      CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
      CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations(created_at);
      CREATE INDEX IF NOT EXISTS idx_analysis_operation_id ON analysis(operation_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_sheet_name ON analysis(sheet_name);
      
      -- Ek indeksler
      CREATE INDEX IF NOT EXISTS idx_operations_user_id ON operations(user_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_formula_count ON analysis(formula_count);
      CREATE INDEX IF NOT EXISTS idx_analysis_cell_count ON analysis(cell_count);
      
      -- Partial indeksler
      CREATE INDEX IF NOT EXISTS idx_operations_active ON operations(id) WHERE status = 'active';
      CREATE INDEX IF NOT EXISTS idx_analysis_large_sheets ON analysis(sheet_name) WHERE cell_count > 10000;
      
      -- Expression indeksler
      CREATE INDEX IF NOT EXISTS idx_operations_date_trunc ON operations(date_trunc('day', created_at));
      CREATE INDEX IF NOT EXISTS idx_analysis_lower_sheet_name ON analysis(lower(sheet_name));
    `);
    logger.info('Veritabanı indeksleri oluşturuldu');
  } catch (err) {
    logger.error('İndeks oluşturma hatası:', err);
  }
};

// Veritabanı istatistikleri
const getStats = async () => {
  try {
    const stats = await query(`
      SELECT 
        -- Temel istatistikler
        (SELECT count(*) FROM operations) as total_operations,
        (SELECT count(*) FROM analysis) as total_analysis,
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        
        -- Performans metrikleri
        (SELECT sum(blks_hit) / nullif(sum(blks_hit + blks_read), 0) FROM pg_stat_database) as cache_hit_ratio,
        (SELECT sum(tup_returned) FROM pg_stat_database) as tuples_returned,
        (SELECT sum(tup_fetched) FROM pg_stat_database) as tuples_fetched,
        
        -- İndeks kullanımı
        (SELECT sum(idx_scan) FROM pg_stat_user_indexes) as index_scans,
        (SELECT sum(seq_scan) FROM pg_stat_user_tables) as seq_scans,
        
        -- Tablo boyutları
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        (SELECT sum(pg_total_relation_size(relid)) FROM pg_stat_user_tables) as total_table_size
    `);
    
    // Sorgu istatistiklerini ekle
    const queryStatsArray = Array.from(queryStats.entries()).map(([key, stats]) => ({
      query: key,
      hits: stats.hits,
      misses: stats.misses,
      hitRatio: stats.hits / (stats.hits + stats.misses),
      avgTime: stats.avgTime
    }));
    
    return {
      ...stats.rows[0],
      queryStats: queryStatsArray
    };
  } catch (err) {
    logger.error('İstatistik alma hatası:', err);
    return null;
  }
};

// Veritabanı bakımı
const performMaintenance = async () => {
  try {
    await query(`
      -- Tablo istatistiklerini güncelle
      ANALYZE operations;
      ANALYZE analysis;
      
      -- Boş alanları temizle
      VACUUM ANALYZE operations;
      VACUUM ANALYZE analysis;
      
      -- İndeksleri yeniden oluştur
      REINDEX TABLE operations;
      REINDEX TABLE analysis;
    `);
    logger.info('Veritabanı bakımı tamamlandı');
  } catch (err) {
    logger.error('Bakım hatası:', err);
  }
};

module.exports = {
  query,
  cachedQuery,
  createIndexes,
  getStats,
  performMaintenance,
  pool
}; 