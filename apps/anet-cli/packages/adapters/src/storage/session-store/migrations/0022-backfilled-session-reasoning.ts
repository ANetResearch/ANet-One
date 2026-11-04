// 0020 可能以不带档位的 assistant 回填会话选择；只能给迁移后未动过的会话补同模型 user 档位。
// 本表冻结 0020/0021 的身份规则，不引用实时目录，也不改旧 migration 的内容或 checksum。

export const BACKFILLED_SESSION_REASONING_MIGRATION_SQL = `
WITH last_user AS (
  SELECT session_id, data, row_number() OVER (
    PARTITION BY session_id ORDER BY sequence DESC, time_created DESC, rowid DESC
  ) AS rank
  FROM message
  WHERE CASE WHEN json_valid(data) THEN json_extract(data, '$.role') = 'user' ELSE 0 END
), normalized_user AS (
  SELECT session_id,
    -- 与 0020 一致:本产品没有 builtin:* Provider,旧行里的 builtin:* 归一成 NULL。
    CASE WHEN substr(trim(json_extract(data, '$.modelSelection.providerId')), 1, 8) = 'builtin:'
      THEN NULL ELSE trim(json_extract(data, '$.modelSelection.providerId')) END AS provider_id,
    trim(json_extract(data, '$.modelSelection.modelId')) AS model_id,
    json_extract(data, '$.modelSelection.options.reasoningLevel') AS level
  FROM last_user
  WHERE rank = 1
    AND json_type(data, '$.modelSelection.providerId') = 'text'
    AND json_type(data, '$.modelSelection.modelId') = 'text'
    AND json_type(data, '$.modelSelection.options.reasoningLevel') = 'text'
    AND length(trim(json_extract(data, '$.modelSelection.options.reasoningLevel'))) > 0
), canonical_user AS (
  -- 上游在此按厂商账号套餐的模型名做大小写归一。本产品不提供这些套餐,
  -- 模型名原样取用,不按任何固定目录改写。
  SELECT session_id, provider_id, level, model_id
  FROM normalized_user
), untouched_entries AS (
  SELECT e.id, CASE WHEN json_valid(e.data) THEN e.data ELSE '{}' END AS data, e.session_id
  FROM session_entry e
  JOIN session s ON s.id = e.session_id
  JOIN schema_migration m ON m.id = '0020_provider_model_selection'
  WHERE e.type = 'runtime/model_selection'
    AND e.id = e.session_id || ':runtime-model-selection'
    AND e.time_updated <= m.time_applied AND s.time_updated <= m.time_applied
), repairs AS (
  SELECT e.id, u.level
  FROM untouched_entries e JOIN canonical_user u ON u.session_id = e.session_id
  WHERE json_type(e.data, '$.providerId') IS NULL
    AND json_type(e.data, '$.modelId') IS NULL
    AND json_type(e.data, '$.thoughtLevel') IS NULL
    AND json_type(e.data, '$.modelSelection.options') IS NULL
    AND json_type(e.data, '$.modelSelection.providerId') = 'text'
    AND json_type(e.data, '$.modelSelection.modelId') = 'text'
    AND length(u.provider_id) > 0 AND length(u.model_id) > 0
    AND json_extract(e.data, '$.modelSelection.providerId') = u.provider_id
    AND json_extract(e.data, '$.modelSelection.modelId') = u.model_id
)
UPDATE session_entry AS e
SET data = json_set(data, '$.modelSelection.options.reasoningLevel',
  (SELECT level FROM repairs WHERE repairs.id = e.id))
WHERE id IN (SELECT id FROM repairs);
`;
