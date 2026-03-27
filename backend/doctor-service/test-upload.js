import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testUpload() {
  try {
    const form = new FormData();
    // create dummy image file
    fs.writeFileSync('dummy.jpg', 'fake image content');
    form.append('image', fs.createReadStream('dummy.jpg'));

    // Try a direct POST. We will get 403 Forbidden likely because we lack a token, but let's see if Multer throws 500 FIRST because token middleware is BEFORE Multer.
    // Wait, the route is verifyToken, allowRoles, THEN upload.single.
    // Let's just create a test route temporarily to bypass auth for debugging.
  } catch(e) {
    console.error(e);
  }
}
testUpload();
