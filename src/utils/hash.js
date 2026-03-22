import bcrypt from "bcryptjs";
import env from "../config/env.js";

export const hash = (plain) => bcrypt.hash(plain, env.bcryptRounds);
export const compare = (plain, hashed) => bcrypt.compare(plain, hashed);
