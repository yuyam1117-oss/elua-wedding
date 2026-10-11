# Elua Wedding — CMS付きウェディングサイト

公開サイト・管理画面・Cloudflare Pages Functions・D1データベース・R2画像ストレージを、役割別に整理したプロジェクトです。

## 機能
- 公開サイト：トップ紹介、コンセプト、プラン、料金表示、お知らせ、写真ギャラリー、お問い合わせフォーム
- 管理画面：サイト文章・連絡先・SNSリンクの編集、プランCRUD、お知らせCRUD、ギャラリーCRUD（R2への画像直接アップロード対応）、お問い合わせ一覧
- 公開/非公開切り替え、並び順、公開日設定
- お問い合わせ内容をD1へ保存し、設定が整えばResend経由で通知メールを送信
- DBの変更履歴を`migrations/`で管理

## ディレクトリのルール
```text
admin/                    管理画面UI
assets/css/               公開・管理画面のスタイル
assets/js/                公開・管理画面のブラウザ処理
functions/api/            公開API・お問い合わせAPI
functions/api/admin/      管理用API
database/schema.sql       初期DB構造の参照用
migrations/               D1マイグレーション（連番）
docs/                     構成・運用ドキュメント
index.html                公開トップページ
```

## 公開前の必須設定
1. GitHubへ解凍した中身をリポジトリのルートにアップロードします（ZIPそのものを置かない）。
2. Cloudflare PagesにGitHubリポジトリを接続します。Build commandは空欄、Build output directoryは`.`です。
3. D1データベースを作成します。Cloudflare PagesのSettings → Functions → D1 database bindingsで変数名`DB`を対象DBに紐付けます。
4. `wrangler.toml`の`database_id`を実際のIDに変更します。
5. R2バケット`elua-wedding-media`を作成し、PagesのSettings → Functions → R2 bucket bindingsで変数名`MEDIA`を紐付けます（`wrangler.toml`にも設定例があります）。
6. D1のマイグレーションを順番に適用します。新規DBでは`npx wrangler d1 migrations apply elua-wedding-db --remote`。既に0001を適用済みなら、追加の`0002_gallery.sql`のみが適用されます。適用前に対象DB名を必ず確認してください。
7. Cloudflare Pagesの環境変数/Secretsに強い`ADMIN_PASSWORD`を設定します。パスワードはGitHubに書き込まないでください。
8. メール通知にはResendの`RESEND_API_KEY`と認証済み送信元アドレスの`MAIL_FROM`をSecrets/環境変数に設定します。管理画面で受信先メールアドレスも登録します。

## 画像について
ギャラリーは外部HTTPS画像URLに加え、Cloudflare R2への直接アップロードに対応しています。アップロードはJPEG・PNG・WebP・GIF、8MB以下に制限しています。R2バケットを作成して`MEDIA`バインディングを設定する必要があります。

## セキュリティと検証
管理APIは`ADMIN_PASSWORD`による認証ヘッダーを検証します。これは初期運用用の簡易認証です。公開前に、ログイン試行の制限、短命セッション、問い合わせフォームのレート制限/スパム対策、バックアップ、プライバシーポリシーを追加・確認してください。実際のCloudflareアカウントへのデプロイ、メール送信、実DBのE2EテストはこのZIP作成環境から実施していません。構文・SQL・ZIP検証を行ったうえで、ステージング環境で動作確認してください。
