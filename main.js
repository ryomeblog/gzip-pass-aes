/**
 * サンプル実行方法:
 * 暗号化＋圧縮:
 *   node main.js encrypt input.txt output.gz.aes パスワード
 * 復号＋解凍:
 *   node main.js decrypt output.gz.aes restored.txt パスワード
 */
// AES暗号化＋gzip圧縮・復号＋解凍ユーティリティ
const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// 暗号化＋圧縮
function encryptAndCompress(inputPath, outputPath, password) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const input = fs.createReadStream(inputPath);
    const gzip = zlib.createGzip();
    const output = fs.createWriteStream(outputPath);

    // ヘッダー: IVを先頭に書き込む
    output.write(iv);

    input.pipe(gzip).pipe(cipher).pipe(output);
}

// 復号＋解凍
function decryptAndDecompress(inputPath, outputPath, password) {
    const input = fs.createReadStream(inputPath);

    // 先頭16バイトをIVとして取得
    let iv;
    let remainder;
    input.once('readable', () => {
        iv = input.read(16);
        remainder = input;
        const key = crypto.scryptSync(password, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const gunzip = zlib.createGunzip();
        const output = fs.createWriteStream(outputPath);

        remainder.pipe(decipher).pipe(gunzip).pipe(output);
    });
}

// コマンドライン引数処理
if (require.main === module) {
    const [,, mode, input, output, password] = process.argv;
    if (!mode || !input || !output || !password) {
        console.log('使い方: node main.js [encrypt|decrypt] 入力ファイル 出力ファイル パスワード');
        process.exit(1);
    }
    if (mode === 'encrypt') {
        encryptAndCompress(input, output, password);
        console.log('暗号化＋圧縮完了');
    } else if (mode === 'decrypt') {
        decryptAndDecompress(input, output, password);
        console.log('復号＋解凍完了');
    } else {
        console.log('modeは encrypt または decrypt を指定してください');
    }
}