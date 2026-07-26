const fs = require('fs');
const path = require('path');

const sourcePath = 'c:\\Users\\a\\.gemini\\antigravity-ide\\brain\\ba8ea976-21ac-4c65-a0dd-9f7c380f8796\\media__1785034288560.png';
const destPath = path.join(__dirname, 'app', 'public', 'images', 'madar-logo.png');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('✅ تم تحديث الشعار بنجاح! (Logo updated successfully!)');
} catch (error) {
  console.error('❌ حدث خطأ أثناء تحديث الشعار:', error.message);
}
