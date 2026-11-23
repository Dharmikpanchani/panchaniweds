const fs = require('fs');
const sharp = require('sharp');

// Read media/ganesha.svg
let svgContent = fs.readFileSync('media/ganesha.svg', 'utf8');

// Replace all fill colors with pure white #ffffff
svgContent = svgContent.replace(/fill:\s*#[0-9a-fA-F]+/g, 'fill: #ffffff');
svgContent = svgContent.replace(/fill="[^"]+"/g, 'fill="#ffffff"');

// Ensure viewBox and sizing
sharp(Buffer.from(svgContent))
  .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('badge-96.png')
  .then((info) => {
    console.log('✅ Successfully created badge-96.png:', info);
  })
  .catch((err) => {
    console.error('❌ Error creating badge-96.png:', err);
  });
