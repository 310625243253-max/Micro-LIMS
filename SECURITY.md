# MicroLIMS Security & Regulatory Compliance Specification

## 1. Authentication & Session Security

- **Bcrypt Password Hashing**: Passwords stored using bcrypt with 10 salt rounds.
- **Stateless JWT Tokens**: HMAC-SHA256 signed access tokens (15m validity) with refresh tokens (7d validity).
- **HTTP Header Hardening**: Helmet middleware sets `X-Content-Type-Options`, `X-Frame-Options`, and `Strict-Transport-Security`.

---

## 2. Role-Based Access Control Matrix

| Role | Accessioning | Inoculation | Incubators | Morphology & Tests | AST Panels | QA Review & Sign-off | Audit Trail |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TECHNICIAN** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MICROBIOLOGIST** | ✅ | ✅ | ✅ | ✅ | ✅ | Submit Only | ❌ |
| **REVIEWER** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Sign-off | ❌ |
| **VIEWER** | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |

---

## 3. Cryptographic Tamper-Evidence & Signatures

- **Electronic Signature Hash**: SHA-256 over specimen ID, stage, review decision, signer credentials, and reviewed timestamp.
- **Diagnostic PDF Checksum**: Direct SHA-256 binary hash over generated PDFKit stream.
- **Immutable Master Audit Trail**: Append-only log capturing user ID, IP address, user agent, action code, previous state, new state, and reason.
