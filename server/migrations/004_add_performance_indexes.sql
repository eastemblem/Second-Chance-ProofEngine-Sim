-- Performance Optimization Indexes
-- Strategic indexes for common query patterns

-- Founder table indexes
CREATE INDEX IF NOT EXISTS idx_founder_email ON founders(email);
CREATE INDEX IF NOT EXISTS idx_founder_verification_token ON founders(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_founder_email_verified ON founders(email_verified);

-- Venture table indexes  
CREATE INDEX IF NOT EXISTS idx_venture_founder_id ON ventures(founder_id);
CREATE INDEX IF NOT EXISTS idx_venture_founder_created ON ventures(founder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venture_created_at ON ventures(created_at DESC);

-- Evaluation table indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_venture_id ON evaluations(venture_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_venture_created ON evaluations(venture_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluation_proof_score ON evaluations(proof_score DESC) WHERE proof_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evaluation_leaderboard ON evaluations(proof_score DESC, created_at DESC) WHERE proof_score >= 0;

-- Document upload indexes
CREATE INDEX IF NOT EXISTS idx_document_venture_id ON document_uploads(venture_id);
CREATE INDEX IF NOT EXISTS idx_document_venture_type ON document_uploads(venture_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_uploaded_at ON document_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_status ON document_uploads(status);

-- User activity indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_activity_founder_id ON user_activity(founder_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity');
CREATE INDEX IF NOT EXISTS idx_activity_venture_id ON user_activity(venture_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity');
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity');

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_venture_founder_score ON ventures(founder_id) 
  INCLUDE (certificate_url, report_url, folder_structure);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluation_high_scores ON evaluations(venture_id, proof_score DESC) 
  WHERE proof_score >= 70;

CREATE INDEX IF NOT EXISTS idx_documents_completed ON document_uploads(venture_id, uploaded_at DESC) 
  WHERE status = 'completed';

-- Comments for index strategy
COMMENT ON INDEX idx_evaluation_leaderboard IS 'Optimizes leaderboard queries with score and date ordering';
COMMENT ON INDEX idx_venture_founder_created IS 'Optimizes founder latest venture queries';
COMMENT ON INDEX idx_evaluation_high_scores IS 'Optimizes high-performer queries for deal room access';