# Messages Configuration Guide

All user-facing messages (errors, success, warnings, info) are now centralized in `messages.ts`.

## 📋 File Organization

`app/config/messages.ts` contains all messages organized by category:

- ✅ **Success Messages** - Operation completed, updated, uploaded, etc.
- ❌ **Error Messages** - Failures, invalid input, network errors, etc.
- ⚠️ **Warning Messages** - Membership required, coming soon, etc.
- ℹ️ **Info Messages** - Loading, processing, etc.
- 📝 **Validation Messages** - Field validation, format checks
- 🔐 **Auth Messages** - Login, password, authentication
- 💳 **Membership Messages** - Payment, premium features
- 👤 **Profile Messages** - Account updates, password changes
- 😴 **Sleep & Health** - Sleep tracking messages
- 🌟 **Features** - Feature-related messages
- ❤️ **Favorites** - Favorite management
- 🔍 **Search** - Search-related messages
- 📦 **Plans** - Health package names and labels
- 🎯 **Common Actions** - Save, Cancel, Delete, etc.
- ✔️ **Confirmations** - Confirmation dialogs

---

## 🚀 How to Use

### Basic Usage

```tsx
import { Messages } from "../config/messages";
import Toast from "react-native-toast-message";

// Show success message
Toast.show({
  type: Messages.toast.success,
  text1: Messages.success.title,
  text2: Messages.success.profileUpdated,
});

// Show error message
Toast.show({
  type: Messages.toast.error,
  text1: Messages.error.title,
  text2: Messages.error.failedToUpdateProfile,
});

// Show warning message
Toast.show({
  type: Messages.toast.warning,
  text1: Messages.warning.title,
  text2: Messages.warning.paidMembershipRequired,
});
```

### With Alert

```tsx
import { Messages } from "../config/messages";
import { Alert } from "react-native";

Alert.alert(
  Messages.error.title,
  Messages.error.failedToLoadProfile
);
```

### With Placeholders

```tsx
import { Messages, formatMessage } from "../config/messages";

const phoneDigits = 10;
const message = formatMessage(
  Messages.validation.phoneNumberMustBe,
  { length: phoneDigits.toString() }
);
// Result: "Phone number must be 10 digits."

Toast.show({
  type: Messages.toast.error,
  text1: Messages.error.title,
  text2: message,
});
```

### In TextInput Placeholders

```tsx
import { Messages } from "../config/messages";

<TextInput
  placeholder={Messages.placeholders.enterFullName}
/>
```

### In Buttons

```tsx
import { Messages } from "../config/messages";

<TouchableOpacity>
  <Text>{Messages.actions.save}</Text>
</TouchableOpacity>
```

---

## 📚 Complete Message Categories

### Success Messages
```tsx
Messages.success.title              // "Success"
Messages.success.profileUpdated     // "Profile updated successfully"
Messages.success.passwordChanged    // "Password changed successfully"
Messages.success.imageUploaded      // "Profile image updated."
Messages.success.signedOut          // "You have been signed out."
```

### Error Messages
```tsx
Messages.error.title                    // "Error"
Messages.error.generic                  // "Something went wrong. Please try again."
Messages.error.emailNotExists           // "Email does not exist in our records."
Messages.error.failedToLoadProfile      // "Failed to load profile data. Please try again."
Messages.error.failedToUpdateProfile    // "Failed to update profile. Please try again."
Messages.error.failedToChangePassword   // "Failed to change password. Please try again."
Messages.error.couldNotRemoveFavorite   // "Could not remove from favorites."
Messages.error.invalidYoutubeUrl        // "Invalid YouTube URL"
```

### Warning Messages
```tsx
Messages.warning.title                  // "Warning"
Messages.warning.paidMembershipRequired // "You need to buy paid membership to view the content."
Messages.warning.featureComingSoon      // "feature is coming soon. Stay tuned!"
Messages.warning.underDevelopment       // "screen is under development."
```

### Validation Messages
```tsx
Messages.validation.fieldRequired       // "This field is required"
Messages.validation.invalidEmail        // "Please enter a valid email address"
Messages.validation.passwordMismatch    // "Passwords do not match"
Messages.validation.phoneNumberMustBe   // "Phone number must be {length} digits." (with placeholder)
```

### Profile Messages
```tsx
Messages.profile.profileUpdated         // "Profile updated successfully"
Messages.profile.passwordChanged        // "Password changed successfully"
Messages.profile.imageUploadFailed      // "Image upload failed"
Messages.profile.imageUploaded          // "Profile image updated."
Messages.profile.updateProfileError     // "Failed to update profile. Please try again."
```

### Membership Messages
```tsx
Messages.membership.paidMembershipRequired  // "You need to buy paid membership to view the content."
Messages.membership.premiumFeature          // "This is a premium feature. Please upgrade your membership."
Messages.membership.paymentFailed           // "Payment failed. Please try again."
Messages.membership.paymentSuccessful       // "Payment successful!"
```

### Action Buttons
```tsx
Messages.actions.save       // "Save"
Messages.actions.cancel     // "Cancel"
Messages.actions.delete     // "Delete"
Messages.actions.edit       // "Edit"
Messages.actions.submit     // "Submit"
Messages.actions.close      // "Close"
```

### Placeholders
```tsx
Messages.placeholders.enterFullName        // "Enter your full name"
Messages.placeholders.enterNewPassword     // "Enter new password"
Messages.placeholders.confirmNewPassword   // "Confirm new password"
Messages.placeholders.search               // "Search..."
```

---

## 🔄 Migration Examples

### Before (Hardcoded)
```tsx
Toast.show({
  type: "success",
  text1: "Success",
  text2: "Profile updated successfully",
});
```

### After (Using Messages)
```tsx
import { Messages } from "../config/messages";

Toast.show({
  type: Messages.toast.success,
  text1: Messages.success.title,
  text2: Messages.success.profileUpdated,
});
```

---

## ✅ Benefits

1. **Centralized** - All messages in one file
2. **Maintainable** - Easy to find and update messages
3. **Consistency** - Same message text across the app
4. **Localization Ready** - Easy to translate to other languages
5. **Type Safe** - Messages are organized in objects (IDE autocomplete)
6. **Scalable** - Easy to add new messages
7. **Professional** - Professional wording and tone

---

## 📝 Adding New Messages

To add a new message:

1. Open `app/config/messages.ts`
2. Find the appropriate category (or create a new one)
3. Add your message:

```tsx
export const Messages = {
  // ... existing messages
  myNewCategory: {
    myNewMessage: "Your message text here",
  },
};
```

4. Use in component:
```tsx
import { Messages } from "../config/messages";
Toast.show({
  text2: Messages.myNewCategory.myNewMessage,
});
```

---

## 🎯 All Messages at a Glance

| Category | Count | Examples |
|----------|-------|----------|
| Success | 6 | Profile updated, Password changed, Image uploaded |
| Error | 10+ | Network error, Failed to load, Invalid input |
| Warning | 3 | Membership required, Coming soon, Under development |
| Validation | 7 | Required field, Invalid email, Password mismatch |
| Profile | 8 | Update failed, Password changed, Image uploaded |
| Membership | 4 | Premium feature, Payment failed, Payment successful |
| Sleep/Health | 9 | Check-in, Check-out, Digital detox |
| Placeholders | 6 | Enter name, Enter password, Search |
| Actions | 10 | Save, Cancel, Delete, Edit, Submit |
| **Total** | **60+** | **All user-facing text** |

---

## 💡 Pro Tips

1. **Use `formatMessage()` for dynamic text:**
   ```tsx
   formatMessage(
     Messages.validation.phoneNumberMustBe,
     { length: "10" }
   )
   ```

2. **Group related messages together**

3. **Keep message text concise and clear**

4. **Use consistent terminology across messages**

5. **Test messages on actual UI before finalizing**

---

**All user-facing messages should come from `app/config/messages.ts`!** ✨
