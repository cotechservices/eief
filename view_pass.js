// generate_hash.js
const bcrypt = require('bcryptjs');

const password = '1234EIEF';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Erreur:', err);
    } else {
        console.log('========================================');
        console.log('🔐 HASH BCRYPT GÉNÉRÉ');
        console.log('========================================');
        console.log(`🔑 Mot de passe: ${password}`);
        console.log(`⚙️  Rounds: ${saltRounds}`);
        console.log(`🔒 Hash: ${hash}`);
        console.log('========================================');
        console.log('\n💡 À copier dans la base de données:');
        console.log(`UPDATE utilisateurs SET password = '${hash}' WHERE email = '...';`);
    }
});