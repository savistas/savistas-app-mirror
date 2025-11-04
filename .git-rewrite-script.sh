#!/bin/bash
# Script pour remplacer les clés sensibles dans l'historique Git

# Remplacer la clé Stripe
sed -i '' 's/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/sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/g' "$1" 2>/dev/null || true

# Remplacer le webhook secret
sed -i '' 's/whsec_2yl2YbvdBSnQbKM3oJ3ATb54pmUi8mpt/whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/g' "$1" 2>/dev/null || true
