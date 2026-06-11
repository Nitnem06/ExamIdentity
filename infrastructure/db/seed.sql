-- ExamIdentity demo seed data
-- Applies on top of infrastructure/db/init.sql.
-- ASCII-only (no em dashes) so it survives Windows console / pipe encoding.
-- Idempotent: sessions upsert their display fields; credentials insert once.

-- ---- Schema additions (session-level exam name + accommodation) -----------
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_name     VARCHAR(255);
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS accommodation VARCHAR(50) NOT NULL DEFAULT 'NONE';

-- ---- Category A: student --------------------------------------------------
INSERT INTO students (did, university_id, university_did, public_key, custody_tier, accommodation)
VALUES (
    'did:key:zDemoStudent',
    'univ-demo',
    'did:key:zUniversityDemo',
    'zDemoPublicKeyPlaceholder',
    'STANDARD',
    'NONE'
)
ON CONFLICT (did) DO NOTHING;

-- ---- Category C: exam sessions (self-healing display fields) ---------------
INSERT INTO exam_sessions
    (session_id, exam_id, exam_name, student_did, university_id, state, score_band,
     accommodation, started_at, completed_at)
VALUES
    ('sess-001', 'exam-calculus-ii',     'Calculus II - Final',
     'did:key:zDemoStudent', 'univ-demo', 'COMPLETED', 'HIGH', 'NONE',
     '2026-06-10T10:00:00Z', '2026-06-10T12:00:00Z'),
    ('sess-002', 'exam-data-structures', 'Data Structures - Midterm',
     'did:key:zDemoStudent', 'univ-demo', 'COMPLETED', 'HIGH', 'SCREEN_READER',
     '2026-05-02T09:00:00Z', '2026-05-02T10:30:00Z')
ON CONFLICT (session_id) DO UPDATE
    SET exam_name = EXCLUDED.exam_name,
        accommodation = EXCLUDED.accommodation;

-- ---- Category A: verifiable credentials -----------------------------------
INSERT INTO credentials (student_did, credential_type, credential_json, credential_hash, status)
VALUES (
    'did:key:zDemoStudent',
    'ExamIntegrityCredential',
    '{
      "id": "cred-001",
      "type": ["VerifiableCredential", "ExamIntegrityCredential"],
      "issuer": "did:key:zUniversityDemo",
      "issuanceDate": "2026-06-10T12:05:00Z",
      "credentialSubject": {
        "id": "did:key:zDemoStudent",
        "examName": "Calculus II - Final",
        "issuingInstitution": "Demo University",
        "institutionDid": "did:key:zUniversityDemo",
        "completedAt": "2026-06-10T12:00:00Z",
        "integrityScoreBand": "HIGH",
        "flagCount": 1,
        "disputeStatus": "NOT_DISPUTED",
        "sessionReference": "sess-001"
      }
    }'::jsonb,
    'a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00',
    'ACTIVE'
),
(
    'did:key:zDemoStudent',
    'ExamIntegrityCredential',
    '{
      "id": "cred-002",
      "type": ["VerifiableCredential", "ExamIntegrityCredential"],
      "issuer": "did:key:zUniversityDemo",
      "issuanceDate": "2026-05-02T10:35:00Z",
      "credentialSubject": {
        "id": "did:key:zDemoStudent",
        "examName": "Data Structures - Midterm",
        "issuingInstitution": "Demo University",
        "institutionDid": "did:key:zUniversityDemo",
        "completedAt": "2026-05-02T10:30:00Z",
        "integrityScoreBand": "HIGH",
        "flagCount": 0,
        "disputeStatus": "NOT_DISPUTED",
        "sessionReference": "sess-002"
      }
    }'::jsonb,
    '0f1e2d3c4b5a69788796a5b4c3d2e1f00fedcba9876543210011223344556677',
    'ACTIVE'
)
ON CONFLICT (credential_hash) DO NOTHING;

-- ---- Transparency log: a credential-issued entry (chained off genesis) -----
INSERT INTO transparency_log (entry_hash, prev_hash, tree_hash, entry_type, exam_id, metadata)
SELECT
    encode(sha256(('CRED_ISSUED_cred-001' || g.entry_hash)::bytea), 'hex'),
    g.entry_hash,
    encode(sha256(('TREE_cred-001' || g.tree_hash)::bytea), 'hex'),
    'CREDENTIAL_ISSUED',
    'exam-calculus-ii',
    '{"credentialId": "cred-001", "band": "HIGH"}'::jsonb
FROM transparency_log g
WHERE g.entry_type = 'GENESIS'
ON CONFLICT (entry_hash) DO NOTHING;

SELECT 'ExamIdentity demo seed applied' AS status;
