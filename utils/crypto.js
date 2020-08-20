const CryptoJS = require('crypto-js');

/////*******test2 */
// const defaultKey = "d87d305a8fe54462"; // 默认的key
// const defaultIv = "cc2e0c12c8c04f35"; // 默认的key 偏移量

/////******* prod */
const defaultKey = "f992676d9042451d"; // 默认的key
const defaultIv = "4e417223807e40b6"; // 默认的key 偏移量

function decrypt(messageBase64, key, iv) {
    let keyHex = CryptoJS.enc.Utf8.parse(defaultKey);
    let ivHex = CryptoJS.enc.Utf8.parse(defaultIv);
    let decrypt = CryptoJS.AES.decrypt(messageBase64, keyHex, {
        iv: ivHex,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
}

export default {
    decrypt
}