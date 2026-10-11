# プロジェクト構成ガイド

## どこを編集する？
- 公開サイトの構造：`index.html`
- 公開サイトの見た目：`assets/css/site.css`
- 公開画面の動き/API接続：`assets/js/site.js`
- 管理画面の構造：`admin/index.html`
- 管理画面の見た目：`assets/css/admin.css`
- 管理画面の操作：`assets/js/admin.js`
- サイト設定API：`functions/api/site.js`、管理保存は`functions/api/admin/content.js`
- プランAPI：`functions/api/plans.js`、管理CRUDは`functions/api/admin/plans.js`
- お知らせAPI：`functions/api/notices.js`、管理CRUDは`functions/api/admin/notices.js`
- ギャラリーAPI：`functions/api/gallery.js`、管理CRUDは`functions/api/admin/gallery.js`
- お問い合わせ：`functions/api/contact.js`、管理一覧は`functions/api/admin/inquiries.js`
- 初期DB構造：`migrations/0001_initial.sql`
- ギャラリー追加：`migrations/0002_gallery.sql`

## 新機能の追加ルール
1. DBの変更が必要なら`migrations/0003_説明.sql`のような次の連番を追加します。過去のmigrationは編集しません。
2. 管理APIは`functions/api/admin/`、公開APIは`functions/api/`に配置します。
3. 管理画面のUIは`admin/index.html`、動作は`assets/js/admin.js`、見た目は`assets/css/admin.css`です。機能が増えた場合は管理UIのJSを機能単位ファイルへ分割してください。
4. 公開画面にDB内容を出す場合、公開APIから取得し、HTMLへの挿入は`textContent`を基本にしてXSSを避けます。
5. 公開・非公開、入力上限、URL形式、IDの妥当性をサーバー側で検証します。
