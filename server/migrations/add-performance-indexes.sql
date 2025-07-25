-- Performance optimization indexes for Second Chance platform
-- Phase 1.1B: Strategic Database Indexes for Read Optimization

-- Index for founder lookups (most frequent operation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_founder_id ON founder(founder_id);

-- Index for venture-founder relationship (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_founder_id ON venture(founder_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_created_at ON venture(created_at DESC);

-- Composite index for venture queries with date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venture_founder_date ON venture(founder_id, created_at DESC);

-- Index for evaluation-venture relationship (scoring queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluation_venture_id ON evaluation(venture_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluation_date ON evaluation(evaluation_date DESC);

-- Composite index for latest evaluation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluation_venture_date ON evaluation(venture_id, evaluation_date DESC);

-- Index for document uploads by venture (ProofVault queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_venture_id ON document_upload(venture_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_created_at ON document_upload(created_at DESC);

-- Composite index for document queries with date ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_venture_date ON document_upload(venture_id, created_at DESC);

-- Index for proof vault queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proof_vault_venture_id ON proof_vault(venture_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proof_vault_folder_name ON proof_vault(folder_name);

-- Index for activity tracking (if using user_activity table)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_founder_id ON user_activity(founder_id) WHERE founder_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_venture_id ON user_activity(venture_id) WHERE venture_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_timestamp ON user_activity(timestamp DESC);

-- Index for leaderboard queries (ProofScore ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evaluation_proofscore ON evaluation(proofscore DESC) WHERE proofscore IS NOT NULL;

-- Index for team member queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_venture_id ON team_member(venture_id);

-- Analyze tables to update statistics for query planner
ANALYZE founder;
ANALYZE venture;
ANALYZE evaluation;
ANALYZE document_upload;
ANALYZE proof_vault;
ANALYZE team_member;

-- Performance analysis query to verify index usage
-- Uncomment to run performance analysis:
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT v.*, e.proofscore, e.evaluation_date
-- FROM venture v
-- LEFT JOIN evaluation e ON e.venture_id = v.venture_id
-- WHERE v.founder_id = 'test-founder-id'
-- ORDER BY v.created_at DESC, e.evaluation_date DESC
-- LIMIT 1;