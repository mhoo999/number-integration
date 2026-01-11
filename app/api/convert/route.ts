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
    
    // 원본 파일 확장자 확인
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'xlsx'
    const isXls = fileExtension === 'xls'
    const isCsv = fileExtension === 'csv'
    
    let workbook: XLSX.WorkBook
    if (isCsv) {
      // CSV 파일 처리
      const text = new TextDecoder('utf-8').decode(arrayBuffer)
      workbook = XLSX.read(text, { type: 'string', cellDates: true })
    } else {
      workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
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

    // 원본 파일 형식에 맞춰 출력
    let bookType: 'xls' | 'xlsx' | 'csv'
    let outputFileName: string
    let contentType: string
    
    if (isCsv) {
      bookType = 'csv'
      outputFileName = fileName.replace(/\.csv$/i, '_normalized.csv')
      contentType = 'text/csv; charset=utf-8'
    } else if (isXls) {
      bookType = 'xls'
      outputFileName = fileName.replace(/\.(xlsx|xls)$/i, '_normalized.xls')
      contentType = 'application/vnd.ms-excel'
    } else {
      bookType = 'xlsx'
      outputFileName = fileName.replace(/\.(xlsx|xls)$/i, '_normalized.xlsx')
      contentType = 'application/vnd.openpyxl-officedocument.spreadsheetml.sheet'
    }
    
    let fileBuffer: Buffer
    if (isCsv) {
      const csvString = XLSX.utils.sheet_to_csv(newWorksheet)
      fileBuffer = Buffer.from(csvString, 'utf-8')
    } else {
      fileBuffer = XLSX.write(newWorkbook, {
        type: 'buffer',
        bookType: bookType,
      }) as Buffer
    }

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
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
