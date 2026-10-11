# iPhoneからGitHubへ配置する手順

1. ZIPをダウンロードし、iPhoneの「ファイル」アプリで解凍します。
2. SafariでGitHubの`elua-wedding`リポジトリを開きます。
3. 解凍した中身をリポジトリのルートへ配置します。ZIPファイル自体をアップロードしないでください。GitHubのモバイル画面ではフォルダ一括アップロードが扱いづらい場合があるため、可能ならPCで複数ファイルをまとめてアップロードしてください。
4. リポジトリ直下に`index.html`、`admin/`、`assets/`、`functions/`、`database/`、`migrations/`、`docs/`が並ぶことを確認します。
5. Cloudflare Pagesへ接続し、READMEのD1・Secrets設定を行います。GitHubに管理パスワードやResend APIキーを書かないでください。

iPhoneからアップロードしただけでは公開・DB・メールの設定は完了しません。
