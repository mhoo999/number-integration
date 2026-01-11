import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { normalizePhoneNumber } from '../utils/phone'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const column = formData.get('column') as string
    const format = (formData.get('format') as 'hyphen' | 'compact') || 'hyphen'

    if (!file || !column) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 없습니다' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: '빈 파일입니다' },
        { status: 400 }
      )
    }

    const headers = (data[0] || []).map(String)
    const columnIndex = headers.indexOf(column)

    if (columnIndex === -1) {
      return NextResponse.json(
        { success: false, error: '컬럼을 찾을 수 없습니다' },
        { status: 400 }
      )
    }

    // 데이터 변환
    const rows = data.slice(1)
    const convertedData = rows.map((row) => {
      const newRow = [...row]
      const original = row[columnIndex]
      newRow[columnIndex] = normalizePhoneNumber(original, format)
      return newRow
    })

    // 헤더 + 변환된 데이터
    const result = [headers, ...convertedData]

    // 새 워크북 생성
    const newWorkbook = XLSX.utils.book_new()
    const newWorksheet = XLSX.utils.aoa_to_sheet(result)
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName)

    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(newWorkbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openpyxl-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="normalized.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error in convert:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
