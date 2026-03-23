require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testUpload() {
  // Use a small test image – you can create a dummy file or use an existing one
  const testImagePath = path.join(__dirname, 'public', 'images', 'NudiUtsava Logo_2.png'); // adjust path if needed
  if (!fs.existsSync(testImagePath)) {
    console.error('Test image not found. Please provide a valid image path.');
    return;
  }
  const fileBuffer = fs.readFileSync(testImagePath);
  const fileName = 'test-' + Date.now() + '.png';

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, fileBuffer, { contentType: 'image/png' });

  if (error) {
    console.error('❌ Upload error:', error);
  } else {
    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);
    console.log('✅ Upload successful! Public URL:', publicUrlData.publicUrl);
  }
}

testUpload();