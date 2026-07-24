# MADAR Platform - Authentication Audit Report
## تقرير فحص شامل لنظام المصادقة (Auth)

---

## Executive Summary

| المكون | الحالة |
|--------|--------|
| Backend (NestJS) | Partially Functional |
| Frontend (React) | Mostly Dummy/Static |
| OAuth (Google/LinkedIn) | Not Implemented |
| Email Service | Not Implemented |
| JWT + Refresh Token | Backend: Yes / Frontend: Yes (api.ts) |
| API Integration (Frontend Pages) | Not Connected |

---

## 1. Backend Analysis (NestJS)

### 1.1 `auth/auth.service.ts` -- Status: Partially Real

| Function | Status | Details |
|----------|--------|---------|
| `register(dto)` | **Real** | Checks email in DB, hashes password with bcrypt, creates user in MongoDB, creates role-specific profile (Student/Company/University), generates JWT tokens |
| `login(dto)` | **Real** | Validates email, checks status (banned/inactive), compares password with bcrypt.compare, updates lastLoginAt, generates JWT tokens |
| `refreshToken(refreshToken)` | **Real** | Verifies refresh token with JWT_REFRESH_SECRET, checks user active status, generates new token pair |
| `logout(userId)` | **Real** | Clears user sessions array in DB |
| `getMe(userId)` | **Real** | Fetches user from DB by ID |
| `verifyEmail(email, code)` | **Partial** | Updates isEmailVerified flag, but NO email is actually sent |
| `forgotPassword(email)` | **Dummy** | Returns generic message. NO email sent (no Nodemailer/SendGrid). User check is silent |
| `resetPassword(token, newPassword)` | **Real** | Verifies token, hashes new password, updates in DB |
| `generateTokens()` | **Real** | Creates accessToken (15min) + refreshToken (7d) with proper secrets |

**Verdict:** Core auth flow is REAL (DB + JWT + bcrypt). Password reset is half-implemented (no email sending).

---

### 1.2 `auth/auth.controller.ts` -- Status: Real

| Endpoint | Method | Auth Required | Status |
|----------|--------|---------------|--------|
| `POST /api/auth/register` | register() | No | Real |
| `POST /api/auth/login` | login() | No | Real |
| `POST /api/auth/refresh` | refresh() | No | Real |
| `POST /api/auth/logout` | logout() | Yes (JWT) | Real |
| `POST /api/auth/verify-email` | verifyEmail() | No | Real |
| `POST /api/auth/forgot-password` | forgotPassword() | No | Partial (no email) |
| `POST /api/auth/reset-password` | resetPassword() | No | Real |
| `GET /api/auth/me` | getMe() | Yes (JWT) | Real |

**Cookies:** Sets `access_token` (15min) and `refresh_token` (7d) as httpOnly cookies on login/register/refresh. Clears on logout.

**Verdict:** All endpoints are implemented and connected to service methods.

---

### 1.3 DTOs -- Status: Real with Validation

| DTO | Validation |
|-----|-----------|
| `login.dto.ts` | @IsEmail, @MinLength(1) |
| `register.dto.ts` | @IsEmail, @MinLength(8), regex password validation (upper+lower+number), @IsEnum(UserRole), @IsObject(profile) |
| `refresh-token.dto.ts` | @IsOptional @IsString |
| `forgot-password.dto.ts` | @IsEmail |
| `reset-password.dto.ts` | @MinLength(8), regex password validation |
| `verify-email.dto.ts` | @IsEmail, @Length(6,6) for code |

**Verdict:** Proper class-validator decorators on all DTOs.

---

### 1.4 `auth/auth.module.ts` -- Status: Real (No OAuth)

**Imports:**
- MongooseModule (User, Student, Company, University schemas)
- JwtModule (JWT_SECRET, 15min expiry)

**Providers:** AuthService, JwtAuthGuard, RolesGuard

**Missing:**
- PassportModule (for OAuth)
- GoogleStrategy
- LinkedInStrategy
- Nodemailer/SendGrid module

---

### 1.5 `auth/auth.guard.ts` -- Status: Real

**JwtAuthGuard:**
- Extracts token from `Authorization: Bearer <token>` header OR `access_token` cookie
- Verifies with JWT_SECRET (with 60s clock tolerance)
- Attaches payload to `request.user`
- Throws UnauthorizedException on invalid/missing token

---

### 1.6 Session Module -- Status: Real but Unused by Auth

Session module exists with CRUD operations but the auth system uses a `sessions` array on the User document directly, not this session module.

---

### 1.7 Backend Dependencies (package.json)

```json
"@nestjs/jwt": "^10.2.0"           // YES
"@nestjs/passport": "^10.0.3"       // YES (but unused for OAuth)
"passport": "^0.7.0"                // YES
"passport-jwt": "^4.0.1"            // YES
"bcrypt": "^5.1.1"                  // YES
"class-validator": "^0.14.0"        // YES
"cookie-parser": "^1.4.6"           // YES
```

**Missing:**
- `passport-google-oauth20` - NOT INSTALLED
- `passport-linkedin-oauth2` - NOT INSTALLED
- `nodemailer` - NOT INSTALLED
- `@sendgrid/mail` - NOT INSTALLED

---

## 2. Frontend Analysis (React)

### 2.1 `pages/Login.tsx` -- Status: DUMMY

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (validate()) {
    // TODO: Implement login     <-- DUMMY!
  }
};
```

- Does NOT import or use `useAuth` hook
- Does NOT call any API
- Form validation is client-side only (email regex, password length)
- Google/LinkedIn buttons have NO onClick handler (purely decorative)
- Remember Me checkbox does nothing

**Verdict:** UI only. No API integration.

---

### 2.2 `pages/Register.tsx` -- Status: DUMMY

```tsx
const handleNext = () => {
  if (validateStep()) {
    if (step < 3) setStep(step + 1);
    else setDone(true);        // <-- No API call! Just sets local state
  }
};
```

- Does NOT import or use `useAuth` hook
- Does NOT call any API
- Multi-step wizard with local state only
- On completion (step 3), just shows success screen with links to dashboard
- No actual registration request sent to backend
- Password strength meter is client-side only

**Verdict:** UI only. No API integration. Registration does not create a user.

---

### 2.3 `pages/ForgotPassword.tsx` -- Status: DUMMY

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.trim()) { ... }
  if (!/^\S+@\S+\.\S+$/.test(email)) { ... }
  setError('');
  setSent(true);                // <-- No API call! Just shows success
};
```

- Does NOT call `authApi.forgotPassword()`
- Does NOT use `useAuth` hook
- Just shows a fake success message

**Verdict:** Purely decorative. No backend communication.

---

### 2.4 `hooks/useAuth.ts` -- Status: REAL (but unused by pages)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services';
```

| Hook Feature | Status |
|-------------|--------|
| `useQuery({ queryKey: [AUTH_KEY, 'me'] })` | Real - fetches /auth/me |
| `loginMutation` | Real - calls authApi.login() |
| `registerMutation` | Real - calls authApi.register() |
| `logoutMutation` | Real - calls authApi.logout() + clears cache + redirects |
| Role flags (isAdmin, isStudent, etc.) | Implemented |

**Problem:** This hook is well-implemented using React Query BUT no page actually imports or uses it!

**Verdict:** Hook is real but completely unused.

---

### 2.5 `services/authApi.ts` -- Status: REAL (but unused by pages)

| Function | Endpoint | Token Handling |
|----------|----------|---------------|
| `login(data)` | POST /auth/login | Sets tokens via setTokens() |
| `register(data)` | POST /auth/register | Sets tokens via setTokens() |
| `logout()` | POST /auth/logout | Clears tokens via clearAuth() |
| `getCurrentUser()` | GET /auth/me | Uses existing token |
| `refreshToken(rt)` | POST /auth/refresh | Updates tokens |
| `verifyEmail(code)` | POST /auth/verify-email | - |
| `forgotPassword(email)` | POST /auth/forgot-password | - |
| `resetPassword(token, pw)` | POST /auth/reset-password | - |

**Verdict:** All functions properly map to backend endpoints. Properly handles token storage.

---

### 2.6 `services/api.ts` -- Status: REAL

| Feature | Status |
|---------|--------|
| Axios instance with baseURL | Yes |
| Request interceptor (adds Bearer token) | Yes |
| Response interceptor (401 -> refresh) | Yes |
| Token refresh loop with retry flag | Yes |
| Auto-redirect to /login on auth failure | Yes |
| `setTokens()`, `clearAuth()`, `isAuthenticated()` | Yes |
| `ApiError` custom error class | Yes |

**Response Interceptor Logic:**
1. On 401 error -> attempt token refresh
2. If refresh token exists -> POST /auth/refresh
3. Store new tokens -> retry original request
4. If refresh fails -> clear auth + redirect to /#/login

**Verdict:** Professional-grade API client with full auth handling.

---

### 2.7 Frontend Dependencies (package.json)

```json
"@tanstack/react-query": NOT INSTALLED     <-- PROBLEM!
"axios": NOT INSTALLED                      <-- PROBLEM!
```

Wait - neither `@tanstack/react-query` nor `axios` appear in package.json! This means the `useAuth.ts` hook, `authApi.ts`, and `api.ts` would fail to compile or run if imported.

**Update:** The files exist and are coded correctly but their dependencies are not in package.json. This is a critical issue.

---

## 3. OAuth Analysis

### 3.1 Google OAuth -- Status: NOT IMPLEMENTED

| Requirement | Status |
|-------------|--------|
| `@nestjs/passport` installed | Yes |
| `passport-google-oauth20` installed | **No** |
| GoogleStrategy class | **Does not exist** |
| Google Client ID/Secret in .env | **No** |
| `/api/auth/google` endpoint | **Does not exist** |
| `/api/auth/google/callback` endpoint | **Does not exist** |
| Frontend button calls API | **No** (no onClick handler) |

**Frontend Login.tsx Google button:**
```tsx
<AuthButton variant="outline" icon={<svg ... />}>
  Continue with Google
</AuthButton>
// No onClick handler - purely decorative
```

---

### 3.2 LinkedIn OAuth -- Status: NOT IMPLEMENTED

| Requirement | Status |
|-------------|--------|
| `passport-linkedin-oauth2` installed | **No** |
| LinkedInStrategy class | **Does not exist** |
| LinkedIn Client ID/Secret | **No** |
| `/api/auth/linkedin` endpoint | **Does not exist** |
| Frontend button calls API | **No** (no onClick handler) |

---

## 4. Password Reset / Forgot Password Analysis

### 4.1 Backend

**`forgotPassword(email)` in auth.service.ts:**
```typescript
async forgotPassword(email: string) {
  const user = await this.userModel.findOne({ email }).lean();
  if (!user) {
    return { message: 'If the email exists, a reset link will be sent' };
  }
  // No email is actually sent!
  return { message: 'If the email exists, a reset link will be sent' };
}
```

- Does NOT generate a reset token for email
- Does NOT send any email
- Returns generic message (security through obscurity for non-existent emails)

**`resetPassword(token, newPassword)`:**
- Real implementation: verifies JWT token, hashes new password, updates DB

### 4.2 Frontend

**ForgotPassword.tsx:**
- No API call made
- Just shows fake success screen

**Missing:**
- Nodemailer or SendGrid service
- Email templates
- SMTP configuration
- Reset token generation for email sending

---

## 5. JWT Refresh Token Analysis

### 5.1 Backend

| Aspect | Status |
|--------|--------|
| Refresh token generation | Yes (7-day expiry, separate secret) |
| Refresh endpoint | Yes (`POST /api/auth/refresh`) |
| Token verification | Yes (with clock tolerance) |
| Cookie-based refresh | Yes (httpOnly, sameSite=strict) |

### 5.2 Frontend

| Aspect | Status |
|--------|--------|
| Token storage (localStorage) | Yes |
| Auto-refresh on 401 | Yes (response interceptor) |
| Retry original request | Yes |
| Redirect on refresh failure | Yes |

**Verdict:** Full JWT refresh implementation on BOTH sides (api.ts). However, pages don't use it since they don't make API calls.

---

## 6. Critical Disconnect: Pages vs API

The most critical finding is that **the frontend pages are completely disconnected from the API layer**:

```
Pages (Login.tsx, Register.tsx, ForgotPassword.tsx)
    |
    |---> NO CONNECTION! (just local state + TODO comments)
    |
useAuth.ts hook (React Query + authApi)
    |
    |---> authApi.ts (Axios + endpoints)
    |
    |---> api.ts (Axios instance + interceptors)
    |
Backend (NestJS controllers + services + MongoDB)
```

### What this means:
- A user can fill out the login form, click submit, and... nothing happens (no API call)
- A user can fill out the registration wizard, click "Create Account", and... no user is created
- A user can enter their email in forgot password, click submit, and... just a fake success message
- The social login buttons (Google, LinkedIn) are purely decorative

---

## 7. Detailed Code Evidence

### Evidence: Login.tsx is dummy
```typescript
// Line 33-38 in Login.tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (validate()) {
    // TODO: Implement login    // <-- EMPTY!
  }
};
```

### Evidence: Register.tsx is dummy
```typescript
// Line 88-92 in Register.tsx
const handleNext = () => {
  if (validateStep()) {
    if (step < 3) setStep(step + 1);
    else setDone(true);           // <-- No API call, just local state!
  }
};
```

### Evidence: ForgotPassword.tsx is dummy
```typescript
// Line 16-28 in ForgotPassword.tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ... validation only ...
  setSent(true);                   // <-- No API call!
};
```

### Evidence: Google button has no handler
```tsx
// Lines 133-137 in Login.tsx
<AuthButton variant="outline" icon={<svg>...</svg>}>
  Continue with Google
</AuthButton>
// No onClick prop!
```

### Evidence: Backend forgotPassword sends no email
```typescript
// Lines 152-159 in auth.service.ts
async forgotPassword(email: string) {
  const user = await this.userModel.findOne({ email }).lean();
  if (!user) {
    return { message: 'If the email exists, a reset link will be sent' };
  }
  this.logger.log(`Password reset requested for: ${email}`);
  return { message: 'If the email exists, a reset link will be sent' };
  // No email sent!
}
```

---

## 8. Recommendations (Priority Order)

### P0 - Critical (Blocks basic functionality)
1. **Connect Login.tsx to useAuth hook**: Replace `// TODO: Implement login` with actual `loginMutation.mutateAsync()` call
2. **Connect Register.tsx to useAuth hook**: Call `registerMutation.mutateAsync()` with form data
3. **Connect ForgotPassword.tsx to authApi**: Call `authApi.forgotPassword(email)`
4. **Add missing dependencies**: `@tanstack/react-query`, `axios` must be added to package.json

### P1 - High (Required for production)
5. **Implement email service**: Install Nodemailer or SendGrid, create email templates, connect to forgotPassword
6. **Add Google OAuth**: Install `passport-google-oauth20`, create GoogleStrategy, add endpoints
7. **Add LinkedIn OAuth**: Install `passport-linkedin-oauth2`, create LinkedInStrategy, add endpoints
8. **Verify email flow**: Generate and send verification codes via email

### P2 - Medium (Improvements)
9. **Add loading states** to form submissions
10. **Add error handling** with toast notifications (sonner is already installed)
11. **Add form-level React Hook Form integration** (@hookform/resolvers and react-hook-form are installed)
12. **Route guards** - Protect routes based on authentication state

---

## 9. Final Verdict

| Component | Backend Status | Frontend Status | Integration Status |
|-----------|---------------|-----------------|-------------------|
| Login (Email/Password) | Real (DB + JWT + bcrypt) | Dummy (no API call) | Not Connected |
| Register | Real (DB + profile creation) | Dummy (no API call) | Not Connected |
| JWT Access Token | Real (15min, signed) | Real (stored, sent in headers) | Available but unused |
| JWT Refresh Token | Real (7d, cookie) | Real (auto-refresh interceptor) | Available but unused |
| Logout | Real (clears DB sessions) | Real (clears cache + redirect) | Available but unused |
| Get Current User | Real (DB lookup) | Real (React Query hook) | Available but unused |
| Google OAuth | Not Implemented | Decorative button only | N/A |
| LinkedIn OAuth | Not Implemented | Decorative button only | N/A |
| Forgot Password | Half (no email) | Dummy (no API call) | Not Connected |
| Reset Password | Real (token + hash) | Not Implemented | N/A |
| Verify Email | Real (DB update) | Not Implemented | N/A |
| Email Service | Not Installed | N/A | N/A |

---

## 10. Scoring

| Category | Score | Max |
|----------|-------|-----|
| Backend Auth Service | 8/10 | 10 |
| Backend OAuth | 0/10 | 10 |
| Backend Email | 0/10 | 10 |
| Frontend Pages (UI) | 9/10 | 10 |
| Frontend API Integration | 0/10 | 10 |
| Frontend Auth Hook/API | 9/10 | 10 |
| JWT/Security | 8/10 | 10 |
| **Overall** | **34/70** | **70** |

---

*Report generated by Authentication Audit Tool*
*Date: July 2025*
