/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 엑셀 파일 처리용 설정
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
