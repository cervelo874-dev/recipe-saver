// タグのスマート自動分類キーワード辞書

const GENRE_KEYWORDS = [
    '和食', '洋食', '中華', 'イタリアン', 'フレンチ', '韓国', '韓国料理', 'エスニック',
    'タイ料理', 'ベトナム料理', 'インド料理', 'メキシカン', 'アメリカン', 'アジア', '西洋料理'
]

const FEATURE_KEYWORDS = [
    '主菜', '副菜', 'メイン', 'メイン料理', '汁物', 'スープ', 'サラダ', 'デザート', 'スイーツ',
    'おやつ', 'おつまみ', '丼', 'パスタ', 'ご飯もの', '麺類', '鍋', 'グラタン', 'ドリア',
    '時短', '簡単', '超簡単', '10分', '15分', '5分', '手軽', '節約', 'コスパ',
    'ヘルシー', '低カロリー', '糖質制限', 'ダイエット', '作り置き', '常備菜', 'お弁当', 'おべんとう',
    '定番', 'パーティー', 'おもてなし', '電子レンジ', 'フライパン', 'トースター', '炊飯器', '煮込み'
]

const INGREDIENT_KEYWORDS = [
    // 肉類
    '豚肉', '豚バラ', '豚ロース', '豚こま', '豚ひき肉', 'ひき肉', '合いびき肉',
    '鶏肉', '鶏もも', '鶏むね', 'ささみ', '手羽先', '牛肉', '牛バラ', '牛こま', 'ベーコン', 'ソーセージ', 'ハム',
    // 魚介類
    '魚', '鮭', 'サケ', 'サーモン', 'サバ', '鯖', 'タラ', 'エビ', '海老', 'イカ', 'タコ', 'ホタテ', 'ツナ', 'ツナ缶',
    // 野菜・きのこ・芋
    'じゃがいも', 'ジャガイモ', 'ポテト', '玉ねぎ', 'たまねぎ', 'タマネギ', 'にんじん', '人参', 'ニンジン',
    'キャベツ', '白菜', 'レタス', 'ほうれん草', '小松菜', 'ブロッコリー', 'トマト', 'ミニトマト',
    'きゅうり', 'ナス', 'なす', 'ピーマン', '大根', 'ごぼう', '長ネギ', 'ねぎ', 'ネギ',
    'きのこ', 'しめじ', 'えのき', 'エリンギ', 'しいたけ', 'マッシュルーム',
    // 豆・乳製品・卵・その他
    '豆腐', '納豆', '油揚げ', '厚揚げ', '卵', 'たまご', 'チーズ', '牛乳', 'バター', '生クリーム', 'アボカド'
]

export const CATEGORIES = [
    { key: 'genre', label: '🍱 料理ジャンル', icon: '🍱' },
    { key: 'feature', label: '⚡ 料理の種類・特徴', icon: '⚡' },
    { key: 'ingredient', label: '🥕 食材・材料', icon: '🥕' },
    { key: 'other', label: '🏷️ その他', icon: '🏷️' }
]

/**
 * タグ一覧を4つのカテゴリに自動分類する
 * @param {string[]} tags
 * @returns {Record<'genre'|'feature'|'ingredient'|'other', string[]>}
 */
export function categorizeTags(tags = []) {
    const categorized = {
        genre: [],
        feature: [],
        ingredient: [],
        other: []
    }

    if (!Array.isArray(tags)) return categorized

    // 重複除去
    const uniqueTags = [...new Set(tags.filter(Boolean))]

    for (const tag of uniqueTags) {
        const lower = tag.toLowerCase()

        // 1. 料理ジャンル判定
        if (GENRE_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) {
            categorized.genre.push(tag)
            continue
        }

        // 2. 特徴・種類判定
        if (FEATURE_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) {
            categorized.feature.push(tag)
            continue
        }

        // 3. 食材判定
        if (INGREDIENT_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) {
            categorized.ingredient.push(tag)
            continue
        }

        // 4. その他
        categorized.other.push(tag)
    }

    return categorized
}
