-- Phase 1 (identity): universities registry.
-- Institutions that can run exams and issue credentials. Students reference a
-- university at enrollment (students.university_id / university_did).
-- Idempotent.

CREATE TABLE IF NOT EXISTS universities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    did             VARCHAR(255) UNIQUE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_universities_university_id ON universities(university_id);

-- Demo institution (matches the DID used elsewhere in the seed data).
INSERT INTO universities (university_id, name, did)
VALUES ('univ-demo', 'Demo University', 'did:key:zUniversityDemo')
ON CONFLICT (university_id) DO NOTHING;

SELECT 'ExamIdentity identity migration applied' AS status;
