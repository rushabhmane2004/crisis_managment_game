require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function checkUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    console.log(users);
    mongoose.connection.close();
}

checkUsers();
