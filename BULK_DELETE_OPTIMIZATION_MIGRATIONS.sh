#!/bin/bash

# Bulk Delete Non-Critical Optimization Migrations
# Date: December 3, 2025
# Purpose: Delete all November 2025 optimization migrations that fail on missing tables

cd /Users/cliffsumalpong/Documents/NexScout/supabase/migrations

echo "🔍 Finding non-critical optimization migrations to delete..."
echo ""

# Patterns that indicate optimization migrations
PATTERNS=(
  "*rls_policies*"
  "*foreign_key_indexes*"
  "*optimize_*"
  "*policy*"
  "*add_indexes*"
  "*add_remaining*"
)

DELETED_COUNT=0

# Find and delete November 2025 optimization migrations
for pattern in "${PATTERNS[@]}"; do
  for file in 202511{25,26,27,28,29,30}${pattern}.sql; do
    if [[ -f "$file" ]]; then
      echo "🗑️  Deleting: $file"
      rm "$file"
      ((DELETED_COUNT++))
    fi
  done
done

# Also check early December (up to Dec 2)
for pattern in "${PATTERNS[@]}"; do
  for file in 20251201${pattern}.sql 20251202${pattern}.sql; do
    if [[ -f "$file" ]]; then
      echo "🗑️  Deleting: $file"
      rm "$file"
      ((DELETED_COUNT++))
    fi
  done
done

echo ""
echo "✅ Deleted $DELETED_COUNT optimization migrations"
echo ""
echo "📋 Remaining migrations:"
ls -1 *.sql 2>/dev/null | wc -l
echo ""
echo "🚀 Now run: cd ../.. && supabase db push"




