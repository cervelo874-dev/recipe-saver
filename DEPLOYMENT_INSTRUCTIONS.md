# GitHub Pages デプロイ手順

## 1. Git初期化とコミット

コマンドプロンプト（cmd）を開いて、以下のコマンドを順番に実行してください：

```bash
cd c:\Users\cerve\OneDrive\デスクトップ\AntiGravity\recipe-saver

git init

git add .

git commit -m "Initial commit: Recipe Saver with AI extraction"

git branch -M main

git remote add origin https://github.com/cervelo874-dev/recipe-saver.git

git push -u origin main
```

## 2. GitHub Secretsの設定

1. https://github.com/cervelo874-dev/recipe-saver/settings/secrets/actions にアクセス
2. **New repository secret** をクリック
3. Name: `VITE_GEMINI_API_KEY`
4. Value: あなたのGemini APIキー（.envファイルから）を貼り付け
5. **Add secret** をクリック

## 3. GitHub Pagesの設定

1. https://github.com/cervelo874-dev/recipe-saver/settings/pages にアクセス
2. **Source**: **GitHub Actions** を選択
3. 保存（自動保存されます）

## 4. デプロイの確認

1. https://github.com/cervelo874-dev/recipe-saver/actions にアクセス
2. "Deploy to GitHub Pages" ワークフローが実行中/完了したことを確認
3. 完了後、https://cervelo874-dev.github.io/recipe-saver/ でアプリにアクセス

## トラブルシューティング

### Gitコマンドが認識されない場合
- Git Bashを使用してください
- または、GitHub Desktopアプリを使用できます

### デプロイが失敗する場合
- GitHub Actionsのログを確認
- VITE_GEMINI_API_KEYが正しく設定されているか確認
