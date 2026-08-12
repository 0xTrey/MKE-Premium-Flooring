export function getOfficeTeamPassword() {
  return process.env.OFFICE_TEAM_PASSWORD || "pe-flooring-office";
}

export function getOfficeSessionSecret() {
  return process.env.OFFICE_SESSION_SECRET || "pe-flooring-session-secret";
}

export function getOfficeSessionDays() {
  return Number(process.env.OFFICE_SESSION_DAYS || 7);
}

export function getOfficeCompanyName() {
  return process.env.QUOTE_COMPANY_NAME || "P&E Premium Flooring";
}

export function getOfficeCompanyPhone() {
  return process.env.QUOTE_COMPANY_PHONE || "(414) 275-1889";
}

export function getOfficeCompanyEmail() {
  return process.env.QUOTE_COMPANY_EMAIL || "Pepremiumflooring@gmail.com";
}

export function getOfficeCompanyAddress() {
  return process.env.QUOTE_COMPANY_ADDRESS || "Milwaukee Metro Area";
}

export function getAiExtractionApiUrl() {
  return process.env.AI_EXTRACTION_API_URL || "";
}

export function getAiExtractionKey() {
  return process.env.AI_EXTRACTION_KEY || "";
}

export function getAiExtractionModel() {
  return process.env.AI_EXTRACTION_MODEL || "document-extractor";
}

export function getOfficeChatApiKey() {
  return process.env.GEMINI_API_KEY || process.env.OFFICE_CHAT_API_KEY || "";
}

export function getOfficeChatModel() {
  return process.env.GEMINI_MODEL || process.env.OFFICE_CHAT_MODEL || "gemini-2.5-flash";
}

export function getOfficeChatApiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${getOfficeChatModel()}:generateContent`;
}
