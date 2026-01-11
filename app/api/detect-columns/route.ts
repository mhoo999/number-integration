import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { detectPhoneColumn } from '../utils/phone'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다' },
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

    // 첫 번째 행을 헤더로 사용
    const headers = (data[0] || []).map(String)
    const rows = data.slice(1)

    // 2D 배열로 변환 (헤더 제외)
    const dataArray = rows.map(row => {
      const newRow: any[] = []
      for (let i = 0; i < headers.length; i++) {
        newRow[i] = row[i] ?? null
      }
      return newRow
    })

    const detectedColumns = detectPhoneColumn(dataArray, headers)

    return NextResponse.json({
      success: true,
      columns: headers,
      detectedColumns,
      rowCount: rows.length,
      columnCount: headers.length,
    })
  } catch (error) {
    console.error('Error in detect-columns:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
