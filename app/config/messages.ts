// config/messages.ts
// All user-facing messages organized by category
// Use these instead of hardcoded strings in components

export const Messages = {
  // ═══════════════════════════════════════════════════════════════
  // SUCCESS MESSAGES
  // ═══════════════════════════════════════════════════════════════
  success: {
    title: "Success",
    profileUpdated: "Profile updated successfully",
    passwordChanged: "Password changed successfully",
    imageUploaded: "Profile image updated.",
    signedOut: "You have been signed out.",
    operationSuccess: "Operation completed successfully",
  },

  // ═══════════════════════════════════════════════════════════════
  // ERROR MESSAGES
  // ═══════════════════════════════════════════════════════════════
  error: {
    title: "Error",
    generic: "Something went wrong. Please try again.",
    procesIdBlank: "Process ID is blank",
    emailNotExists: "Email does not exist in our records.",
    signOutFailed: "Sign-out failed",
    tryAgain: "Please try again.",
    imageUploadFailed: "Image upload failed",
    couldNotRemoveFavorite: "Could not remove from favorites.",
    failedToLoadProfile: "Failed to load profile data. Please try again.",
    failedToUpdateProfile: "Failed to update profile. Please try again.",
    failedToChangePassword: "Failed to change password. Please try again.",
    invalidYoutubeUrl: "Invalid YouTube URL",
    processIdError: "Process ID is blank",
    suggestusError: "An error occurred. Please try again.",
  },

  // ═══════════════════════════════════════════════════════════════
  // WARNING MESSAGES
  // ═══════════════════════════════════════════════════════════════
  warning: {
    title: "Warning",
    paidMembershipRequired: "You need to buy paid membership to view the content.",
    featureComingSoon: "feature is coming soon. Stay tuned!",
    underDevelopment: "screen is under development.",
  },

  // ═══════════════════════════════════════════════════════════════
  // INFO MESSAGES
  // ═══════════════════════════════════════════════════════════════
  info: {
    comingSoon: "Coming Soon",
    loading: "Loading...",
    processing: "Processing...",
    please_wait: "Please wait...",
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION MESSAGES
  // ═══════════════════════════════════════════════════════════════
  validation: {
    fieldRequired: "This field is required",
    invalidEmail: "Please enter a valid email address",
    emailDoesNotExist: "Email does not exist in our records.",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    invalidPhoneNumber: "Invalid phone number",
    invalidPhoneLength: "Phone number must be {length} digits.",
    invalidInputFormat: "Invalid format",
    invalidUrl: "Invalid URL",
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGIN & AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════
  auth: {
    invalidNumber: "Invalid Number",
    phoneNumberMustBe: "Phone number must be {length} digits.",
    signOutFailed: "Sign-out failed",
    tryAgainLater: "Please try again later.",
  },

  // ═══════════════════════════════════════════════════════════════
  // MEMBERSHIP & PAYMENT
  // ═══════════════════════════════════════════════════════════════
  membership: {
    paidMembershipRequired: "You need to buy paid membership to view the content.",
    premiumFeature: "This is a premium feature. Please upgrade your membership.",
    paymentFailed: "Payment failed. Please try again.",
    paymentSuccessful: "Payment successful!",
  },

  // ═══════════════════════════════════════════════════════════════
  // PROFILE & ACCOUNT
  // ═══════════════════════════════════════════════════════════════
  profile: {
    imageUploadFailed: "Image upload failed",
    imageUploaded: "Profile image updated.",
    profileUpdated: "Profile updated successfully",
    passwordChanged: "Password changed successfully",
    updateProfileError: "Failed to update profile. Please try again.",
    changePasswordError: "Failed to change password. Please try again.",
    loadProfileError: "Failed to load profile data. Please try again.",
    passwordMismatch: "Passwords do not match",
  },

  // ═══════════════════════════════════════════════════════════════
  // SLEEP & HEALTH TRACKING
  // ═══════════════════════════════════════════════════════════════
  sleep: {
    checkIn: "Sleep check-in",
    checkOut: "Sleep check-out",
    timeCheck: "Time Check",
    intakeCheck: "Check Intake",
    bedCheck: "Bed Check",
    roomCheck: "Room Check",
    digitalDetox: "Digital Detox",
    stressCheck: "Stress Check",
    calmYourMind: "Calm your Mind",
    paidMembershipRequired: "You need to buy paid membership to view the content.",
  },

  // ═══════════════════════════════════════════════════════════════
  // FEATURES & NAVIGATION
  // ═══════════════════════════════════════════════════════════════
  features: {
    comingSoon: "Coming Soon",
    featureComingSoon: "feature is coming soon. Stay tuned!",
    underDevelopment: "screen is under development.",
    home: "Home",
  },

  // ═══════════════════════════════════════════════════════════════
  // FAVORITES
  // ═══════════════════════════════════════════════════════════════
  favorites: {
    removeFailed: "Could not remove from favorites.",
    addFailed: "Could not add to favorites.",
    searchPlaceholder: "Search favorites...",
  },

  // ═══════════════════════════════════════════════════════════════
  // SEARCH & CONTENT
  // ═══════════════════════════════════════════════════════════════
  search: {
    placeholder: "Search...",
    noResults: "No results found",
    paidMembershipRequired: "You need to buy paid membership to view the content.",
  },

  // ═══════════════════════════════════════════════════════════════
  // DRAWER & MENU
  // ═══════════════════════════════════════════════════════════════
  drawer: {
    signedOut: "You have been signed out.",
    signOutFailed: "Sign-out failed",
    tryAgain: "Please try again.",
    featureComingSoon: "feature is coming soon. Stay tuned!",
    underDevelopment: "screen is under development.",
  },

  // ═══════════════════════════════════════════════════════════════
  // HEALTH PACKAGES & PLANS
  // ═══════════════════════════════════════════════════════════════
  plans: {
    paidMembershipRequired: "You need to buy paid membership to view the content.",
    silverHealthCheckUp: "Men's Silver Health Check Up",
    goldHealthCheckUp: "Women's Gold Health Check Up",
    platinumHealthCheck: "Men's Platinum Health Check",
    below40: "(Below 40 Yrs.)",
    above40: "(Above 40 Yrs.)",
    executive: "Executive Health Package",
  },

  // ═══════════════════════════════════════════════════════════════
  // FORM PLACEHOLDERS
  // ═══════════════════════════════════════════════════════════════
  placeholders: {
    enterFullName: "Enter your full name",
    enterContactNumber: "Enter your contact number",
    enterNewPassword: "Enter new password",
    confirmNewPassword: "Confirm new password",
    search: "Search...",
    searchFavorites: "Search favorites...",
  },

  // ═══════════════════════════════════════════════════════════════
  // COMMON ACTIONS
  // ═══════════════════════════════════════════════════════════════
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    update: "Update",
    submit: "Submit",
    confirm: "Confirm",
    close: "Close",
    next: "Next",
    back: "Back",
    done: "Done",
    ok: "OK",
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIRMATIONS & DIALOGS
  // ═══════════════════════════════════════════════════════════════
  confirmation: {
    areYouSure: "Are you sure?",
    confirmDelete: "Are you sure you want to delete this?",
    confirmLogout: "Are you sure you want to log out?",
    confirmAction: "Please confirm this action",
  },

  // ═══════════════════════════════════════════════════════════════
  // TOAST MESSAGE TYPES
  // ═══════════════════════════════════════════════════════════════
  toast: {
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  },
};

// Helper function to format messages with placeholders
export const formatMessage = (template: string, replacements: Record<string, string>): string => {
  let message = template;
  Object.keys(replacements).forEach((key) => {
    message = message.replace(`{${key}}`, replacements[key]);
  });
  return message;
};

// Usage Example:
// import { Messages, formatMessage } from "../config/messages";
// Toast.show({
//   type: Messages.toast.success,
//   text1: Messages.success.title,
//   text2: Messages.success.profileUpdated,
// });
//
// formatMessage(Messages.validation.phoneNumberMustBe, { length: "10" })
// => "Phone number must be 10 digits."
