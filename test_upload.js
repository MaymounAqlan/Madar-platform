const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
  fs.writeFileSync('fake.pdf', 'dummy content');
  const form = new FormData();
  form.append('file', fs.createReadStream('fake.pdf'));

  try {
    const res = await axios.post('http://localhost:3000/api/students/cv-upload/async', form, {
      headers: form.getHeaders()
    });
    console.log("SUCCESS", res.data);
  } catch (err) {
    if (err.response) {
      console.log("ERROR", err.response.status, err.response.data);
    } else {
      console.log("ERROR", err.message);
    }
  }
}
run();
