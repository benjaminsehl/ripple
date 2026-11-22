import { test } from "node:test"
test("[T8] live store", { skip: process.env.RIPPLE_STORE_URL ? false : "RIPPLE_STORE_URL is not set" }, () => {})
