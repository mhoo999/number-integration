from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import re
from io import BytesIO
import json

app = Flask(__name__)
CORS(app)

def normalize_phone_number(phone, format_style='hyphen'):
    """
    전화번호를 정규화합니다.
    
    Args:
        phone: 전화번호 (문자열 또는 숫자)
        format_style: 'hyphen' (000-0000-0000) 또는 'compact' (00000000000)
    
    Returns:
        정규화된 전화번호 문자열
    """
    if pd.isna(phone):
        return phone
    
    # 문자열로 변환하고 공백 제거
    phone_str = str(phone).strip()
    
    # 숫자만 추출
    digits = re.sub(r'\D', '', phone_str)
    
    # 빈 문자열이면 원본 반환
    if not digits:
        return phone_str
    
    # 한국 전화번호 형식 확인 (10자리 또는 11자리)
    if len(digits) == 11:
        # 휴대폰 번호: 010-1234-5678
        if format_style == 'hyphen':
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        else:
            return digits
    elif len(digits) == 10:
        # 지역번호 포함 (02-1234-5678 또는 031-123-4567)
        if format_style == 'hyphen':
            if digits.startswith('02'):
                # 서울: 02-1234-5678
                return f"{digits[:2]}-{digits[2:6]}-{digits[6:]}"
            else:
                # 지방: 031-123-4567
                return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        else:
            return digits
    else:
        # 형식이 맞지 않으면 원본 반환 (또는 공백 제거만)
        return digits if format_style == 'compact' else phone_str

def detect_phone_column(df):
    """
    데이터프레임에서 전화번호가 포함된 것으로 보이는 컬럼을 찾습니다.
    """
    phone_columns = []
    
    for col in df.columns:
        # 각 컬럼에서 숫자 패턴이 있는지 확인
        sample_size = min(10, len(df))
        phone_count = 0
        
        for val in df[col].head(sample_size):
            if pd.notna(val):
                val_str = str(val)
                # 숫자만 추출했을 때 10자리 또는 11자리인 경우
                digits = re.sub(r'\D', '', val_str)
                if len(digits) in [10, 11] and digits.isdigit():
                    phone_count += 1
        
        # 샘플의 30% 이상이 전화번호 형식이면 후보로 추가
        if phone_count >= sample_size * 0.3:
            phone_columns.append(col)
    
    return phone_columns

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/api/detect-columns', methods=['POST'])
def detect_columns():
    try:
        file = request.files['file']
        df = pd.read_excel(file)
        
        detected_columns = detect_phone_column(df)
        
        return jsonify({
            "success": True,
            "columns": df.columns.tolist(),
            "detected_columns": detected_columns,
            "row_count": len(df),
            "column_count": len(df.columns)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/preview', methods=['POST'])
def preview():
    try:
        file = request.files['file']
        column = request.form.get('column')
        format_style = request.form.get('format', 'hyphen')  # 'hyphen' or 'compact'
        
        df = pd.read_excel(file)
        
        if column not in df.columns:
            return jsonify({"success": False, "error": "컬럼을 찾을 수 없습니다"}), 400
        
        # 미리보기 데이터 (5행)
        preview_df = df[[column]].head(5).copy()
        preview_df['normalized'] = preview_df[column].apply(
            lambda x: normalize_phone_number(x, format_style)
        )
        
        return jsonify({
            "success": True,
            "preview": preview_df.to_dict('records')
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/convert', methods=['POST'])
def convert():
    try:
        file = request.files['file']
        column = request.form.get('column')
        format_style = request.form.get('format', 'hyphen')
        
        df = pd.read_excel(file)
        
        if column not in df.columns:
            return jsonify({"success": False, "error": "컬럼을 찾을 수 없습니다"}), 400
        
        # 전화번호 변환
        df[column] = df[column].apply(
            lambda x: normalize_phone_number(x, format_style)
        )
        
        # 엑셀 파일 생성
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openpyxl-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='normalized.xlsx'
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Vercel 배포를 위한 export
# app 객체를 export해야 Vercel이 인식할 수 있습니다
# if __name__ == '__main__':
#     app.run(debug=True)
