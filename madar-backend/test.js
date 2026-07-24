const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/madar').then(async () => {
  const unis = await mongoose.connection.collection('universities').find({ slug: { $nin: ['mdu', 'mcu'] } }).toArray();
  for(const uni of unis) {
    if(uni.slug) {
      let url = uni.slug + '.edu.ye';
      if (uni.website) {
        try {
          const urlObj = new URL(uni.website.startsWith('http') ? uni.website : 'https://' + uni.website);
          url = urlObj.hostname.replace('www.', '');
        } catch(e){}
      }
      console.log(uni.nameAr + '|' + 'admin@' + url + '|' + 'coordinator@' + url);
    }
  }
  mongoose.disconnect();
});
