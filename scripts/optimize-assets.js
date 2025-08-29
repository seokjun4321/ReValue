const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// 이미지 최적화 설정
const IMAGE_QUALITY = 80;
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 75;

// 이미지 파일 찾기
const findImages = () => {
  return glob.sync('assets/images/**/*.{png,jpg,jpeg,gif}', {
    cwd: path.resolve(__dirname, '..'),
    absolute: true
  });
};

// 이미지 최적화
const optimizeImage = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // 이미지가 너무 크면 리사이즈
    if (metadata.width > MAX_WIDTH) {
      image.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // 포맷별 최적화
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      await image
        .jpeg({ quality: IMAGE_QUALITY, progressive: true })
        .toFile(imagePath.replace(/\.[^.]+$/, '_optimized.jpg'));
    } else if (metadata.format === 'png') {
      await image
        .png({ quality: IMAGE_QUALITY, compressionLevel: 9 })
        .toFile(imagePath.replace(/\.[^.]+$/, '_optimized.png'));
    }
    
    // WebP 버전 생성
    await image
      .webp({ quality: WEBP_QUALITY })
      .toFile(imagePath.replace(/\.[^.]+$/, '.webp'));
      
    console.log(`✓ Optimized: ${path.basename(imagePath)}`);
  } catch (error) {
    console.error(`✗ Failed to optimize: ${path.basename(imagePath)}`, error);
  }
};

// 메인 함수
async function main() {
  console.log('🔍 Finding images...');
  const images = findImages();
  console.log(`Found ${images.length} images`);
  
  console.log('\n🛠 Optimizing images...');
  await Promise.all(images.map(optimizeImage));
  
  console.log('\n✨ Optimization complete!');
}

// 스크립트 실행
main().catch(console.error);
