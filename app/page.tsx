'use client'

import { useState, useCallback } from 'react'
import styles from './page.module.css'

interface PreviewData {
  original: string | number
  normalized: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [detectionMode, setDetectionMode] = useState<'manual' | 'auto'>('manual')
  const [format, setFormat] = useState<'hyphen' | 'compact'>('hyphen')
  const [preview, setPreview] = useState<PreviewData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setIsProcessing(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/detect-columns', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setColumns(data.columns)
        setDetectedColumns(data.detectedColumns || [])
        setSelectedColumn(data.columns[0] || '')
        setMessage({ type: 'success', text: `파일을 성공적으로 불러왔습니다. (${data.rowCount}행, ${data.columnCount}열)` })
      } else {
        setMessage({ type: 'error', text: `오류: ${data.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const loadPreview = useCallback(async () => {
    if (!file || !selectedColumn) return

    setIsProcessing(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('column', selectedColumn)
    formData.append('format', format)

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setPreview(data.preview)
      } else {
        setMessage({ type: 'error', text: `오류: ${data.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` })
    } finally {
      setIsProcessing(false)
    }
  }, [file, selectedColumn, format])

  const handleConvert = useCallback(async () => {
    if (!file || !selectedColumn) return

    setIsProcessing(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('column', selectedColumn)
    formData.append('format', format)

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `normalized_${file.name}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: '변환이 완료되었습니다! 파일이 다운로드되었습니다.' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: `오류: ${data.error || '변환 실패'}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` })
    } finally {
      setIsProcessing(false)
    }
  }, [file, selectedColumn, format])

  const displayColumns = detectionMode === 'auto' && detectedColumns.length > 0 
    ? detectedColumns 
    : columns

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>전화번호 통일</h1>
        <p className={styles.subtitle}>
          엑셀 파일의 전화번호를 <strong>00000000000</strong> 또는 <strong>000-0000-0000</strong> 형식으로 통일합니다.
        </p>

        {message && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.uploadSection}>
          <div
            className={styles.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <p className={styles.uploadText}>엑셀 파일을 선택하거나 드래그하세요</p>
            <p className={styles.uploadSubtext}>(.xlsx, .xls)</p>
          </div>
        </div>

        {columns.length > 0 && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>컬럼 선택</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="mode"
                    value="manual"
                    checked={detectionMode === 'manual'}
                    onChange={(e) => setDetectionMode(e.target.value as 'manual' | 'auto')}
                  />
                  <span>컬럼 직접 선택 (권장)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="mode"
                    value="auto"
                    checked={detectionMode === 'auto'}
                    onChange={(e) => setDetectionMode(e.target.value as 'manual' | 'auto')}
                  />
                  <span>자동 감지 (보조)</span>
                </label>
              </div>
              {detectionMode === 'auto' && detectedColumns.length > 0 && (
                <p className={styles.infoText}>
                  전화번호로 추정되는 컬럼: {detectedColumns.join(', ')}
                </p>
              )}
              <select
                className={styles.select}
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                {displayColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>형식 선택</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="format"
                    value="hyphen"
                    checked={format === 'hyphen'}
                    onChange={(e) => setFormat(e.target.value as 'hyphen' | 'compact')}
                  />
                  <span>000-0000-0000 (하이픈 포함)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="format"
                    value="compact"
                    checked={format === 'compact'}
                    onChange={(e) => setFormat(e.target.value as 'hyphen' | 'compact')}
                  />
                  <span>00000000000 (하이픈 없음)</span>
                </label>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>변환 미리보기</h2>
              <button
                className={styles.button}
                onClick={loadPreview}
                disabled={isProcessing}
              >
                미리보기 새로고침
              </button>
              {preview.length > 0 && (
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>변환 전</th>
                      <th>변환 후</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index}>
                        <td>{String(row.original)}</td>
                        <td>{row.normalized}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.section}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleConvert}
                disabled={isProcessing}
              >
                {isProcessing ? '처리 중...' : '변환 실행 및 다운로드'}
              </button>
            </div>
          </>
        )}

        <div className={styles.footerSection}>
          <a
            href="https://hoons-service-archive.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles.buttonLink}`}
          >
            다른 서비스 이용해보기
          </a>
          <a
            href="https://need-coffee.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles.buttonLink}`}
          >
            개발자 커피 한잔 사주기
          </a>
        </div>
      </div>
    </main>
  )
}
