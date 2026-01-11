import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '전화번호 형식 통일 서비스',
  description: '엑셀 파일의 전화번호를 통일된 형식으로 변환합니다',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
