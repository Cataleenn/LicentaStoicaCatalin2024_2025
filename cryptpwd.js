const bcrypt = require('bcrypt');

const saltRounds = 10;
const plainPassword = 'admin'; // Parola reală

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Hashed Password:', hash);
});
