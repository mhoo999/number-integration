import streamlit as st
import pandas as pd
import re
from io import BytesIO

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
        
        # 샘플의 50% 이상이 전화번호 형식이면 후보로 추가
        if phone_count >= sample_size * 0.3:
            phone_columns.append(col)
    
    return phone_columns

def main():
    st.set_page_config(
        page_title="전화번호 통일 앱",
        page_icon="📞",
        layout="wide"
    )
    
    st.title("📞 전화번호 통일 앱")
    st.markdown("엑셀 파일의 전화번호를 **00000000000** 또는 **000-0000-0000** 형식으로 통일합니다.")
    
    # 파일 업로드
    uploaded_file = st.file_uploader(
        "엑셀 파일을 업로드하세요 (.xlsx, .xls)",
        type=['xlsx', 'xls']
    )
    
    if uploaded_file is not None:
        try:
            # 엑셀 파일 읽기
            df = pd.read_excel(uploaded_file)
            
            st.success(f"✅ 파일을 성공적으로 불러왔습니다. ({len(df)}행, {len(df.columns)}열)")
            
            # 데이터 미리보기
            with st.expander("📋 데이터 미리보기", expanded=True):
                st.dataframe(df.head(10), use_container_width=True)
            
            st.divider()
            
            # 컬럼 선택 방식
            detection_mode = st.radio(
                "컬럼 선택 방식",
                ["컬럼 직접 선택 (권장)", "자동 감지 (보조)"],
                horizontal=True
            )
            
            selected_column = None
            
            if detection_mode == "컬럼 직접 선택 (권장)":
                selected_column = st.selectbox(
                    "전화번호가 있는 컬럼을 선택하세요",
                    df.columns.tolist(),
                    index=0
                )
            else:
                # 자동 감지
                detected_columns = detect_phone_column(df)
                
                if detected_columns:
                    st.info(f"🔍 전화번호로 추정되는 컬럼: {', '.join(detected_columns)}")
                    selected_column = st.selectbox(
                        "전화번호 컬럼을 선택하세요",
                        detected_columns,
                        index=0
                    )
                else:
                    st.warning("⚠️ 자동으로 전화번호 컬럼을 찾을 수 없습니다. 컬럼을 직접 선택해주세요.")
                    selected_column = st.selectbox(
                        "전화번호가 있는 컬럼을 선택하세요",
                        df.columns.tolist(),
                        index=0
                    )
            
            if selected_column:
                # 선택한 컬럼의 샘플 데이터 표시
                st.markdown(f"**'{selected_column}' 컬럼 샘플 데이터:**")
                sample_data = df[selected_column].head(5).tolist()
                for i, val in enumerate(sample_data, 1):
                    st.text(f"{i}. {val}")
                
                st.divider()
                
                # 형식 선택
                format_style = st.radio(
                    "통일할 전화번호 형식을 선택하세요",
                    ["000-0000-0000 (하이픈 포함)", "00000000000 (하이픈 없음)"],
                    horizontal=True
                )
                
                format_type = 'hyphen' if '하이픈 포함' in format_style else 'compact'
                
                # 변환 미리보기
                st.markdown("**변환 미리보기:**")
                preview_df = df[[selected_column]].head(5).copy()
                preview_df['변환 후'] = preview_df[selected_column].apply(
                    lambda x: normalize_phone_number(x, format_type)
                )
                st.dataframe(preview_df, use_container_width=True)
                
                # 변환 실행 버튼
                if st.button("🔄 변환 실행", type="primary", use_container_width=True):
                    # 전체 데이터 변환
                    df[selected_column] = df[selected_column].apply(
                        lambda x: normalize_phone_number(x, format_type)
                    )
                    
                    st.success("✅ 변환이 완료되었습니다!")
                    
                    # 변환된 데이터 표시
                    with st.expander("📊 변환된 데이터 확인", expanded=True):
                        st.dataframe(df, use_container_width=True)
                    
                    # 다운로드 버튼
                    output = BytesIO()
                    with pd.ExcelWriter(output, engine='openpyxl') as writer:
                        df.to_excel(writer, index=False)
                    
                    st.download_button(
                        label="📥 변환된 파일 다운로드",
                        data=output.getvalue(),
                        file_name=f"normalized_{uploaded_file.name}",
                        mime="application/vnd.openpyxl-officedocument.spreadsheetml.sheet",
                        use_container_width=True
                    )
        
        except Exception as e:
            st.error(f"❌ 오류가 발생했습니다: {str(e)}")
            st.info("파일 형식을 확인해주세요.")
    
    else:
        st.info("👆 엑셀 파일을 업로드하여 시작하세요.")

if __name__ == "__main__":
    main()
