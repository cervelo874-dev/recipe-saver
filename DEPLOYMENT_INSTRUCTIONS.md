# GitHub Desktop でのデプロイ手順

## ステップ1: GitHub Desktop のインストール

1. https://desktop.github.com/ にアクセス
2. **Download for Windows** をクリック
3. ダウンロードしたファイルを実行してインストール
4. インストール後、GitHub Desktopを開く

## ステップ2: GitHubアカウントでサインイン

1. GitHub Desktopを開く
2. **File** → **Options** → **Accounts**
3. **Sign in** をクリックしてGitHubアカウントでサインイン

## ステップ3: ローカルリポジトリを作成

1. **File** → **Add local repository** をクリック
2. **Choose...** をクリックして以下のフォルダを選択：
   ```
   c:\Users\cerve\OneDrive\デスクトップ\AntiGravity\recipe-saver
   ```
3. 「This directory does not appear to be a Git repository」と表示されたら、**create a repository** をクリック
4. Repository name: `recipe-saver`
5. **Create repository** をクリック

## ステップ4: 初回コミット

GitHub Desktopの左下に変更されたファイル一覧が表示されます。

1. 左下の **Summary** 欄に：`Initial commit: Recipe Saver with AI extraction`
2. **Commit to main** ボタンをクリック

## ステップ5: GitHubに公開（Publish）

1. 上部の **Publish repository** ボタンをクリック
2. 設定画面で：
   - Name: `recipe-saver`
   - Description: （任意）`AI-powered recipe saving app`
   - ☑ **Keep this code private** のチェックを**外す**（公開する場合）
3. **Publish repository** をクリック

これで https://github.com/cervelo874-dev/recipe-saver にコードがアップロードされます！

---

## 次のステップ: GitHub Secretsの設定

リポジトリが公開されたら、以下を行ってください：

### 1. APIキーをSecretsに追加

1. ブラウザで以下にアクセス：
   https://github.com/cervelo874-dev/recipe-saver/settings/secrets/actions

2. **New repository secret** をクリック

3. 入力：
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Secret**: あなたのGemini APIキー
     （`.env`ファイルから`VITE_GEMINI_API_KEY=`の後の部分をコピー）

4. **Add secret** をクリック

### 2. GitHub Pagesを有効化

1. ブラウザで以下にアクセス：
   https://github.com/cervelo874-dev/recipe-saver/settings/pages

2. **Source** を **GitHub Actions** に変更

3. 自動的に保存されます

### 3. デプロイを確認

1. ブラウザで以下にアクセス：
   https://github.com/cervelo874-dev/recipe-saver/actions

2. 「Deploy to GitHub Pages」ワークフローが実行されていることを確認

3. 完了（緑のチェックマーク）したら、以下でアプリにアクセス：
   **https://cervelo874-dev.github.io/recipe-saver/**

---

## トラブルシューティング

### デプロイが失敗する場合
- Actionsタブでエラーログを確認
- `VITE_GEMINI_API_KEY` が正しく設定されているか確認

### アプリが動かない場合
- ブラウザのコンソール（F12）でエラーを確認
- APIキーが正しいか確認

---

完了したら教えてください！🎉
