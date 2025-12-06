/*
  # Add Missing Foreign Key Indexes - Company Tables Batch 2

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in company experiments, extraction, and learning systems
    
  2. Indexes Added
    - Company experiments: company_experiment_variants, company_experiments
    - Company extraction: company_extracted_data, company_image_intelligence
    - Company personas: company_persona_learning_logs, company_personas
    - Company playbooks: company_playbooks
    - Company styles: company_style_overrides
*/

-- Company experiment indexes
CREATE INDEX IF NOT EXISTS idx_company_experiment_variants_experiment_id ON company_experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_company_experiments_company_id ON company_experiments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_experiments_user_id ON company_experiments(user_id);

-- Company extraction indexes
CREATE INDEX IF NOT EXISTS idx_company_extracted_data_user_id ON company_extracted_data(user_id);
CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_asset_id ON company_image_intelligence(asset_id);
CREATE INDEX IF NOT EXISTS idx_company_image_intelligence_user_id ON company_image_intelligence(user_id);

-- Company persona indexes
CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_company_id ON company_persona_learning_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_persona_id ON company_persona_learning_logs(persona_id);
CREATE INDEX IF NOT EXISTS idx_company_persona_learning_logs_user_id ON company_persona_learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_personas_company_id ON company_personas(company_id);
CREATE INDEX IF NOT EXISTS idx_company_personas_user_id ON company_personas(user_id);

-- Company playbook indexes
CREATE INDEX IF NOT EXISTS idx_company_playbooks_company_id ON company_playbooks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_playbooks_user_id ON company_playbooks(user_id);

-- Company style indexes
CREATE INDEX IF NOT EXISTS idx_company_style_overrides_company_id ON company_style_overrides(company_id);
CREATE INDEX IF NOT EXISTS idx_company_style_overrides_user_id ON company_style_overrides(user_id);
