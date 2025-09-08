/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 🥕 당근마켓 스타일 Green 컬러 팔레트
        carrot: {
          50: '#f0fdf4',   // 매우 연한 Green
          100: '#dcfce7',  // 연한 Green
          200: '#bbf7d0',  // 밝은 Green
          300: '#86efac',  // 중간 밝은 Green
          400: '#4ade80',  // 기본 Green
          500: '#22c55e',  // 메인 Green (당근마켓 오렌지를 Green으로)
          600: '#16a34a',  // 진한 Green
          700: '#15803d',  // 더 진한 Green
          800: '#166534',  // 매우 진한 Green
          900: '#14532d',  // 가장 진한 Green
        },
        // 보조 컬러
        secondary: {
          50: '#f8fafc',   // 연한 회색
          100: '#f1f5f9',  // 밝은 회색
          200: '#e2e8f0',  // 중간 밝은 회색
          300: '#cbd5e1',  // 중간 회색
          400: '#94a3b8',  // 기본 회색
          500: '#64748b',  // 진한 회색
          600: '#475569',  // 더 진한 회색
          700: '#334155',  // 매우 진한 회색
          800: '#1e293b',  // 다크 회색
          900: '#0f172a',  // 가장 진한 회색
        },
        // 상태 컬러
        success: '#22c55e',    // 성공 (Green)
        warning: '#f59e0b',    // 경고 (Yellow)
        error: '#ef4444',      // 에러 (Red)
        info: '#3b82f6',       // 정보 (Blue)
        // 기존 컬러 유지 (하위 호환성)
        green: {
          100: '#AED581'
        },
        yellow: {
          100: '#FFFF66'
        }
      } 
    },
  },
  plugins: [],
}