import bcrypt from "bcryptjs";
import env from "../config/env.js";

export const hash = (plain) => bcrypt.hash(plain, env.bcryptRounds);
export const compare = (plain, hashed) => bcrypt.compare(plain, hashed);

// node -e "import('./src/utils/hash.js').then(m => m.hash('Admin@12345').then(h => console.log(h)))"