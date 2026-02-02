# Security Scan Remediation Checklist

This checklist resolves the current scan failures one by one. Check items off as you complete them.

## 1) Snyk authentication
- [ ] Choose auth method: `SNYK_TOKEN` env var (CI/local) or interactive `snyk auth`.
- [ ] If using token: set `SNYK_TOKEN` and re-run `npm run security:snyk`.
- [ ] If using interactive auth: run `snyk auth`, then re-run `npm run security:snyk`.

## 2) Semgrep availability
- [ ] Install Semgrep (global or devDependency).
- [ ] Re-run `npm run security:semgrep`.

## 3) Full security scan
- [ ] Run `npm run security:scan` and capture results.

## 4) npm audit highs
- [ ] Decide if breaking changes are acceptable.
- [ ] If yes: run `npm audit fix --force`, then re-test.
- [ ] If no: upgrade specific packages to non-breaking safe versions (AWS SDK chain + Next).
- [ ] Re-run `npm run security:audit`.

## 5) ESLint errors (blockers)
- [ ] Fix all `@typescript-eslint/no-explicit-any` errors.
- [ ] Fix `react-hooks/refs` errors (no ref access during render).
- [ ] Fix `react-hooks/set-state-in-effect` errors.
- [ ] Re-run `npm run lint` until zero errors.

## 6) ESLint security warnings (triage)
- [ ] Review `security/detect-object-injection` warnings.
- [ ] Review `security/detect-non-literal-fs-filename` warnings.
- [ ] Fix or suppress with rationale where appropriate.

## 7) Final verification
- [ ] Run `npm run security:scan`.
- [ ] Run `npm run lint`.

## Notes
- Current `npm audit` report shows high-severity issues in `fast-xml-parser` (via AWS SDK) and `next`.
- `security:scan` stops early if Snyk/Semgrep are not configured.
