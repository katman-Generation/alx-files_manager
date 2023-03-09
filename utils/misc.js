export default function decodeBase64(data) {
    const buf = Buffer.from(data, 'base64');
    return buf;
}