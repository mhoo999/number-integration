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
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'xlsx'
    const isCsv = fileExtension === 'csv'
    
    let workbook: XLSX.WorkBook
    if (isCsv) {
      // CSV 파일 처리
      const text = new TextDecoder('utf-8').decode(arrayBuffer)
      workbook = XLSX.read(text, { type: 'string' })
    } else {
      workbook = XLSX.read(arrayBuffer, { type: 'array' })
    }
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

    const rows = data.slice(1)
    const preview = rows.slice(0, 5).map((row) => {
      const original = row[columnIndex] ?? ''
      const normalized = normalizePhoneNumber(original, format)
      return {
        original,
        normalized,
      }
    })

    return NextResponse.json({
      success: true,
      preview,
    })
  } catch (error) {
    console.error('Error in preview:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
