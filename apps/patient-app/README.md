# Patient App (PoC)

- Port: 5181
- Purpose: collect answers, encrypt on-device, background sync to API
- Modules live in `src/modules/*`:
  - `assessment/` – your AssessmentDataModule.js + adapter
  - `sync/` – commit-and-sync helper (WebCrypto) + API calls
  - `viewer/` – (later) read-only viewer for decrypted answers
