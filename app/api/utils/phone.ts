/**
 * 전화번호를 정규화합니다.
 * @param phone 전화번호 (문자열 또는 숫자)
 * @param formatStyle 'hyphen' (000-0000-0000) 또는 'compact' (00000000000)
 * @returns 정규화된 전화번호 문자열
 */
export function normalizePhoneNumber(
  phone: string | number | null | undefined,
  formatStyle: 'hyphen' | 'compact' = 'hyphen'
): string {
  if (phone === null || phone === undefined) {
    return ''
  }

  // 문자열로 변환하고 공백 제거
  const phoneStr = String(phone).trim()

  // 숫자만 추출
  const digits = phoneStr.replace(/\D/g, '')

  // 빈 문자열이면 원본 반환
  if (!digits) {
    return phoneStr
  }

  // 한국 전화번호 형식 확인 (10자리 또는 11자리)
  if (digits.length === 11) {
    // 휴대폰 번호: 010-1234-5678
    if (formatStyle === 'hyphen') {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    } else {
      return digits
    }
  } else if (digits.length === 10) {
    // 지역번호 포함 (02-1234-5678 또는 031-123-4567)
    if (formatStyle === 'hyphen') {
      if (digits.startsWith('02')) {
        // 서울: 02-1234-5678
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
      } else {
        // 지방: 031-123-4567
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
      }
    } else {
      return digits
    }
  } else {
    // 형식이 맞지 않으면 원본 반환 (또는 공백 제거만)
    return formatStyle === 'compact' ? digits : phoneStr
  }
}

/**
 * 데이터프레임에서 전화번호가 포함된 것으로 보이는 컬럼을 찾습니다.
 */
export function detectPhoneColumn(
  data: any[][],
  headers: string[]
): string[] {
  const phoneColumns: string[] = []

  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const colName = headers[colIndex]
    const sampleSize = Math.min(10, data.length)
    let phoneCount = 0

    for (let rowIndex = 0; rowIndex < sampleSize; rowIndex++) {
      const val = data[rowIndex]?.[colIndex]
      if (val !== null && val !== undefined) {
        const valStr = String(val)
        // 숫자만 추출했을 때 10자리 또는 11자리인 경우
        const digits = valStr.replace(/\D/g, '')
        if (digits.length >= 10 && digits.length <= 11 && /^\d+$/.test(digits)) {
          phoneCount++
        }
      }
    }

    // 샘플의 30% 이상이 전화번호 형식이면 후보로 추가
    if (phoneCount >= sampleSize * 0.3) {
      phoneColumns.push(colName)
    }
  }

  return phoneColumns
}
