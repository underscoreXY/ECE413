const db = require("../db");

const userSchema = new db.Schema({
    email:      String,
    passwordHash:   String,
    activeToken :     String,
});

const User = db.model("User", userSchema);

module.exports = User;