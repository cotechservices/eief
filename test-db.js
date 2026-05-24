import { query } from "./lib/db.js";

query("SELECT NOW()", [])
  .then(res => console.log(res.rows))
  .catch(err => console.error(err));