#!/bin/bash

# GitHub Repository Creation and Push Script
# საჭიროა GitHub Personal Access Token

REPO_NAME="smart-reader-pro"
GITHUB_USER="akakisanadze"
TOKEN="$1"  # პირველი არგუმენტი არის Token

if [ -z "$TOKEN" ]; then
    echo "გამოყენება: ./upload_to_github.sh YOUR_GITHUB_TOKEN"
    echo "Token-ის შესაქმნელად: https://github.com/settings/tokens"
    exit 1
fi

# რეპოზიტორიის შექმნა GitHub API-ის მეშვეობით
echo "რეპოზიტორიის შექმნა GitHub-ზე..."
curl -H "Authorization: token $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     -X POST \
     -d "{\"name\":\"$REPO_NAME\",\"private\":false}" \
     https://api.github.com/user/repos

echo ""
echo "რეპოზიტორია შექმნილია!"

# Push ლოკალური რეპოზიტორიიდან
echo "პროექტის ატვირთვა..."
git push -u origin master

echo ""
echo "✅ პროექტი წარმატებით აიტვირთა!"
echo "URL: https://github.com/$GITHUB_USER/$REPO_NAME"
