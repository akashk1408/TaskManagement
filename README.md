# Task Management App

A production-quality React Native task management application with secure authentication, robust task management, and reliable offline sync capabilities.

## Features Implemented

### Core Features (Mandatory)

#### 1. Authentication
- ✅ Email & password signup and login (mock authentication ready for Firebase/Supabase/Auth0 integration)
- ✅ Form validation with user-friendly error messages
- ✅ Secure token storage using Expo SecureStore
- ✅ Pre-configured users:
  - Admin: `admin@example.com` (password: any 6+ characters)
  - User 1: `user1@example.com` (password: any 6+ characters)
  - User 2: `user2@example.com` (password: any 6+ characters)

#### 2. Navigation
- ✅ React Navigation with Native Stack Navigator
- ✅ Three main screens:
  - Login / Signup
  - Task Dashboard (with filters and sorting)
  - Task Detail (view/edit)
- ✅ Protected routes with authentication state management
- ✅ Automatic redirects based on auth state

#### 3. Data Persistence
- ✅ Local storage using AsyncStorage
- ✅ Task data schema includes:
  - Task ID
  - Title
  - Description
  - Completed flag
  - Status (not_started, in_progress, completed)
  - Timestamps (createdAt, updatedAt)
  - Task assigned date
  - Optional due date
- ✅ User data persistence
- ✅ Ready for Firebase Realtime/Firestore or Supabase integration

#### 4. Task Management
- ✅ **Admin CRUD Operations:**
  - Create tasks
  - Read/view tasks
  - Update tasks (all fields)
  - Delete tasks
- ✅ **User CRUD Operations:**
  - Read/view tasks
  - Update task status (not_started → in_progress → completed)
  - Delete tasks
- ✅ Mark tasks complete/incomplete
- ✅ Optimistic UI updates for smooth UX
- ✅ Role-based permissions

#### 5. State Management
- ✅ Zustand for state management
- ✅ Normalized and modular state:
  - `authStore` - Authentication state
  - `taskStore` - Task management state
  - `syncStore` - Offline sync state
  - `themeStore` - Theme/dark mode state

### Advanced Features

#### 6. Push Notifications
- ✅ Expo Notifications setup
- ✅ Push token registration flow
- ✅ Local notifications support
- ✅ Ready for Firebase Cloud Messaging (FCM) integration
- ✅ Android notification channel configuration

#### 7. Offline Syncing
- ✅ `@react-native-community/netinfo` for connectivity detection
- ✅ Offline action queuing (creates/edits/deletes)
- ✅ Automatic sync when connection is restored
- ✅ Conflict resolution: Last-write-wins strategy
- ✅ Visual indicators for offline status and pending actions

#### 8. Testing
- ✅ Jest configuration
- ✅ React Native Testing Library setup
- ✅ Unit tests for:
  - Task creation and sync logic
  - Offline action processing
  - Sync service functionality

#### 9. App Store Deployment Instructions
- ✅ Written instructions for Google Play Store
- ✅ Written instructions for Apple App Store

### Bonus Features

- ✅ **Dark Mode Toggle** - System-aware theme switching with manual override
- ✅ **Task Filtering** - Filter by status (not_started, in_progress, completed)
- ✅ **Task Sorting** - Sort by assigned date, due date, or title
- ✅ **Task Search** - Search tasks by keywords in title or description
- ✅ **Due Date Management** - Set and manage task due dates
- ✅ **Responsive UI** - Modern, polished interface with animations

## Tech Stack Used

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (Native Stack)
- **State Management:** Zustand
- **Storage:** 
  - AsyncStorage (local data)
  - Expo SecureStore (secure token storage)
- **Offline Sync:** @react-native-community/netinfo
- **Notifications:** Expo Notifications
- **Testing:** Jest, React Native Testing Library
- **Language:** TypeScript
- **UI Components:** React Native core components with custom styling

## How to Run the App

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

3. **Run on specific platform:**
   ```bash
   # iOS
   npx expo start --ios
   
   # Android
   npx expo start --android
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

### Test Accounts

You can use these pre-configured accounts:

- **Admin:**
  - Email: `admin@example.com`
  - Password: Any password with 6+ characters

- **User 1:**
  - Email: `user1@example.com`
  - Password: Any password with 6+ characters

- **User 2:**
  - Email: `user2@example.com`
  - Password: Any password with 6+ characters

Or create a new account using the Sign Up screen.

## State Management Approach

The app uses **Zustand** for state management, organized into four main stores:

1. **authStore** - Manages authentication state, user data, and auth operations
2. **taskStore** - Handles task CRUD operations, filtering, and sorting
3. **syncStore** - Manages offline sync state and connectivity monitoring
4. **themeStore** - Controls dark/light theme mode

Each store is modular and focused on a specific domain, making the codebase maintainable and testable.

## Offline Sync Strategy

### Implementation Details

1. **Connectivity Detection:**
   - Uses `@react-native-community/netinfo` to monitor network status
   - Automatically subscribes to connectivity changes on app start

2. **Action Queuing:**
   - When offline, all CRUD operations are queued locally
   - Actions are stored in AsyncStorage with metadata (type, payload, timestamp)

3. **Sync Process:**
   - When connection is restored, queued actions are automatically processed
   - Actions are applied in order (FIFO)
   - Local state is updated optimistically for immediate UI feedback

4. **Conflict Resolution:**
   - **Strategy:** Last-write-wins
   - The most recent update takes precedence
   - Timestamps are used to determine the latest write
   - When Firebase is integrated, server timestamps will be authoritative

5. **Visual Feedback:**
   - Offline indicator badge in the header
   - Pending actions counter
   - Pull-to-refresh to manually trigger sync

### Future Enhancements (when Firebase is integrated)

- Server-authoritative conflict resolution
- Real-time synchronization
- Optimistic updates with rollback on failure
- Batch sync operations for better performance

## AI Usage Disclosure

This project was developed with assistance from AI tools (ChatGPT/Claude) for:
- Initial project structure setup
- Code generation for services and stores
- Test case generation
- Documentation writing

All code has been reviewed, customized, and integrated to meet the specific requirements of this assessment.

## App Store Publishing Instructions

### Google Play Store

1. **Prepare the App:**
   ```bash
   # Build Android APK/AAB
   eas build --platform android
   ```

2. **Create a Google Play Console Account:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay the one-time $25 registration fee
   - Complete account setup

3. **Create a New App:**
   - Click "Create app"
   - Fill in app details (name, default language, app type)
   - Accept the declarations

4. **Set Up Store Listing:**
   - Add app description, screenshots, feature graphic
   - Set content rating
   - Add privacy policy URL
   - Configure pricing and distribution

5. **Upload App Bundle:**
   - Go to "Production" → "Create new release"
   - Upload the AAB file generated by EAS Build
   - Add release notes
   - Review and roll out

6. **Complete Store Listing:**
   - Fill in all required fields
   - Add app icon (512x512 PNG)
   - Add screenshots (at least 2, up to 8)
   - Add feature graphic (1024x500)

7. **Submit for Review:**
   - Complete all required sections
   - Submit for review
   - Wait for approval (typically 1-3 days)

### Apple App Store

1. **Prepare the App:**
   ```bash
   # Build iOS app
   eas build --platform ios
   ```

2. **Apple Developer Account:**
   - Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
   - Complete enrollment process

3. **App Store Connect Setup:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app
   - Fill in app information:
     - Bundle ID (must match your app's bundle identifier)
     - App name
     - Primary language
     - SKU (unique identifier)

4. **App Information:**
   - Add app description, keywords, support URL
   - Set category and subcategory
   - Add privacy policy URL
   - Configure pricing and availability

5. **App Store Assets:**
   - App icon (1024x1024 PNG, no transparency)
   - Screenshots (required for all device sizes you support)
   - App preview videos (optional)

6. **Build Submission:**
   - Upload build using Transporter app or Xcode
   - Or use EAS Submit: `eas submit --platform ios`
   - Wait for processing (can take 30 minutes to several hours)

7. **Version Information:**
   - Add version number
   - Add "What's New" release notes
   - Set age rating
   - Add app review information and contact details

8. **Submit for Review:**
   - Complete all required sections
   - Submit for review
   - Wait for approval (typically 24-48 hours, can take longer)

### Additional Notes

- Both stores require privacy policies
- Ensure compliance with platform guidelines
- Test thoroughly on physical devices before submission
- Consider using EAS (Expo Application Services) for streamlined builds and submissions

## Known Issues or Limitations

1. **Authentication:**
   - Currently using mock authentication
   - Firebase/Supabase integration pending
   - No password reset functionality yet

2. **Offline Sync:**
   - Conflict resolution is basic (last-write-wins)
   - No merge conflict handling for simultaneous edits
   - Will be enhanced when backend is integrated

3. **Notifications:**
   - Push notifications are set up but require backend integration
   - FCM/APNS configuration pending
   - No scheduled notifications for due dates yet

4. **Data:**
   - No cloud backup/restore
   - Data is stored locally only
   - Will sync with backend when Firebase is integrated

5. **Performance:**
   - Large task lists (>1000 tasks) may experience performance issues
   - No pagination implemented yet
   - Virtualized lists could be optimized further

6. **Features:**
   - No task categories or tags
   - No task attachments
   - No task sharing/collaboration
   - No calendar view (mentioned as bonus)

## Project Structure

```
TaskManagementApp/
├── src/
│   ├── __tests__/          # Test files
│   ├── navigation/          # Navigation setup
│   ├── screens/             # Screen components
│   ├── services/            # Business logic services
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript type definitions
├── App.tsx                  # Root component
├── index.js                 # Entry point
├── package.json             # Dependencies
├── jest.config.js           # Jest configuration
└── README.md               # This file
```

## Future Enhancements

When Firebase is integrated:

1. **Authentication:**
   - Real Firebase Auth integration
   - Password reset functionality
   - Social login (Google, Apple)

2. **Backend Sync:**
   - Real-time synchronization
   - Server-authoritative conflict resolution
   - Cloud backup and restore

3. **Notifications:**
   - Push notifications via FCM
   - Due date reminders
   - Task assignment notifications

4. **Additional Features:**
   - Task categories and tags
   - File attachments
   - Task sharing and collaboration
   - Calendar view
   - Voice input for tasks
   - Advanced filtering and sorting

## License

This project is created for assessment purposes.

## Contact

For questions or issues, please refer to the project repository.
