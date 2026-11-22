import "@ui-sdk/web/dialog"
import "@ui-sdk/web/tabs"
import { checkPattern } from "@ui-sdk/core/testing"
window.checkPattern = async (sel, pattern) => { try { await checkPattern(document.querySelector(sel), pattern); return "ok" } catch (e) { return String(e.message) } }
