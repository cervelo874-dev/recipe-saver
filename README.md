# Recipe Saver 🍳

AI駆動のレシピ保存・管理ウェブアプリケーション

[![Deploy to GitHub Pages](https://github.com/cervelo874-dev/recipe-saver/actions/workflows/deploy.yml/badge.svg)](https://github.com/cervelo874-dev/recipe-saver/actions/workflows/deploy.yml)

## ✨ 特徴

- 📝 **レシピ管理**: タイトル、材料、手順、タグ、評価、メモを保存
- 🤖 **AI自動抽出**: Gemini APIでレシピURLから材料・手順を自動取得
- 🔍 **検索&フィルター**: タグや評価で簡単に検索
- 💾 **LocalStorage**: ブラウザに安全に保存（サーバー不要）
- 📱 **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- 🎨 **モダンUI**: 食欲をそそるデザインとスムーズなアニメーション

## 🚀 デモ

**URL**: https://cervelo874-dev.github.io/recipe-saver/

## 🛠️ 技術スタック

- **フロントエンド**: React + Vite
- **AI**: Google Gemini API (2.5-flash)
- **スタイリング**: Vanilla CSS
- **デプロイ**: GitHub Pages + GitHub Actions

## 💻 ローカル開発

### 前提条件

- Node.js 18.x以上
- Gemini APIキー（[Google AI Studio](https://aistudio.google.com/app/apikey)で取得）

### セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/cervelo874-dev/recipe-saver.git
cd recipe-saver
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定

`.env`ファイルをプロジェクトルートに作成：
```
VITE_GEMINI_API_KEY=あなたのAPIキー
```

4. 開発サーバーを起動
```bash
npm run dev
```

アプリは http://localhost:5173/ で起動します。

### ビルド

```bash
npm run build
```

## 🌐 デプロイ

このプロジェクトはGitHub Actionsで自動デプロイされます。

### GitHub Secretsの設定

1. リポジトリの **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. Name: `VITE_GEMINI_API_KEY`
4. Value: あなたのGemini APIキーを貼り付け
5. **Add secret** をクリック

### GitHub Pagesの有効化

1. **Settings** → **Pages**
2. Source: **GitHub Actions**
3. 保存

これで、`main`ブランチにプッシュすると自動的にデプロイされます！

## 📖 使い方

1. **レシピ追加**: 「レシピを追加」ボタンをクリック
2. **URL取得**: レシピURLを入力して「URLから取得」をクリック（AIが自動抽出）
3. **手動入力**: 材料と手順を手動で追加・編集可能
4. **保存**: フォームを送信してレシピを保存
5. **検索**: タグや評価でフィルタリングして検索

## 🔐 セキュリティ

- APIキーは`.env`ファイルで管理（Gitにコミットされません）
- GitHub Secretsで安全に保管
- クライアントサイドのみで動作（サーバー不要）

## 📄 ライセンス

MIT

## 👨‍💻 開発者

cervelo874-dev
