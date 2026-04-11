require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const emailToMakeAdmin = process.argv[2];

if (!emailToMakeAdmin) {
  console.log("Please provide an email.\nUsage: node make-admin.js <user-email>");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const user = await User.findOneAndUpdate(
      { email: emailToMakeAdmin.toLowerCase().trim() }, 
      { role: 'admin' }, 
      { new: true }
    );
    
    if (!user) {
      console.log(`User with email ${emailToMakeAdmin} not found.`);
    } else {
      console.log(`\n✅ Success! User ${user.name} (${user.email}) is now an ADMIN.`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
