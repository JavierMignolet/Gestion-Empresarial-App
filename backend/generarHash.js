import bcrypt from "bcryptjs";

const passwordPlano = "123456";
const hash = bcrypt.hashSync(passwordPlano, 10);

console.log(`Hash de ${passwordPlano}:`);
console.log(hash);
