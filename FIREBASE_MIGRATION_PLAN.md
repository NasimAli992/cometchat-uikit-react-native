# Firebase Migration Plan - CometChat to Native Firebase

## 📋 Project Analysis

### Current Dependencies (To Remove):
```
- @cometchat/chat-sdk-react-native (v4.0.21)
- @cometchat/calls-sdk-react-native (v4.4.0)
- @cometchat/chat-uikit-react-native (v5.3.5)
- react-native-callstats (v3.73.22) - CometChat related
```

### Current Architecture:
- **Frontend**: React Native with TypeScript
- **Backend**: CometChat SDK
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Media**: React Native Video, Vision Camera, WebRTC

---

## 🎯 Phase 1: Project Structure & Setup

### New Dependencies to Add:
```json
{
  "@react-native-firebase/app": "^21.0.0",
  "@react-native-firebase/auth": "^21.0.0",
  "@react-native-firebase/firestore": "^21.0.0",
  "@react-native-firebase/storage": "^21.0.0",
  "@react-native-firebase/messaging": "^21.0.0",
  "@react-native-firebase/analytics": "^21.0.0",
  "@react-native-firebase/realtime-database": "^21.0.0",
  "react-native-image-crop-picker": "^0.41.0",
  "react-native-document-picker": "^9.3.0",
  "react-native-audio-recorder-player": "^3.6.0",
  "react-native-fast-image": "^8.5.11",
  "zustand": "^5.0.8",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

### Project Structure:
```
src/
├── app/
│   ├── App.tsx
│   └── providers/
│       ├── FirebaseProvider.tsx
│       ├── AuthProvider.tsx
│       └── NotificationProvider.tsx
├── config/
│   ├── firebase.config.ts
│   └── navigation.config.ts
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── usecases/
│   ├── data/
│   │   ├── datasources/
│   │   ├── models/
│   │   └── repositories/
│   └── presentation/
│       ├── screens/
│       ├── components/
│       └── navigation/
├── features/
│   ├── auth/
│   ├── chat/
│   ├── messages/
│   ├── notifications/
│   ├── storage/
│   └── calls/
├── shared/
│   ├── utils/
│   ├── constants/
│   ├── styles/
│   └── hooks/
└── services/
    ├── firebase/
    ├── storage/
    └── notification/
```

---

## 📦 Phase 2: Core Services Implementation

### 2.1 Firebase Configuration
**File**: `src/config/firebase.config.ts`
- Initialize Firebase app
- Configure auth, Firestore, Storage, FCM
- Setup security rules
- Configure offline persistence

### 2.2 Authentication Service
**Directory**: `src/services/firebase/auth/`

**Features**:
- Phone OTP authentication
- Google Sign-In
- Session management
- User profile management
- Logout with cleanup

### 2.3 Firestore Data Layer
**Directory**: `src/core/data/datasources/`

**Collections Structure**:
```
users/
  ├── {userId}
  │   ├── profile
  │   ├── status (online/offline)
  │   ├── lastSeen
  │   └── contacts[]

conversations/
  ├── {conversationId}
  │   ├── metadata
  │   ├── participants[]
  │   ├── lastMessage
  │   ├── lastMessageTime
  │   ├── unreadCount (per user)
  │   └── createdAt

messages/
  ├── {conversationId}
  │   ├── {messageId}
  │   │   ├── senderId
  │   │   ├── text
  │   │   ├── attachments[]
  │   │   ├── reactions{}
  │   │   ├── replyTo (messageId or null)
  │   │   ├── forwardedFrom
  │   │   ├── deletedFor[]
  │   │   ├── readBy{}
  │   │   ├── typingIndicators{}
  │   │   ├── timestamp
  │   │   └── updatedAt

attachments/
  ├── {conversationId}
  │   ├── {messageId}
  │   │   ├── type (image/video/audio/file)
  │   │   ├── url
  │   │   ├── thumbnail
  │   │   ├── size
  │   │   ├── duration (for audio/video)
  │   │   └── uploadedAt
```

### 2.4 Firebase Security Rules
**File**: `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth != null;
    }

    // Conversations - users can only access if they're participants
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
    }

    // Messages - only participants can read/write
    match /messages/{conversationId}/{messageId} {
      allow read: if existsAfter(/databases/$(database)/documents/conversations/$(conversationId)).data.participants.hasAny([request.auth.uid]);
      allow create: if request.auth.uid == request.resource.data.senderId && 
                       existsAfter(/databases/$(database)/documents/conversations/$(conversationId)).data.participants.hasAny([request.auth.uid]);
      allow update: if request.auth.uid == resource.data.senderId;
      allow delete: if request.auth.uid == resource.data.senderId;
    }

    // Storage - authenticated users can upload
    match /attachments/{conversationId}/{userId}/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == userId && 
                      request.resource.size < 100 * 1024 * 1024; // 100MB limit
    }
  }
}
```

---

## 🔐 Phase 3: Authentication System

### 3.1 Phone OTP Authentication
```typescript
// src/features/auth/data/datasources/phone_auth_datasource.ts
- requestPhoneVerification(phoneNumber: string)
- verifyPhoneOTP(verificationId: string, code: string)
- handleAuthStateChange()
```

### 3.2 Google Authentication
```typescript
// src/features/auth/data/datasources/google_auth_datasource.ts
- signInWithGoogle()
- signOutGoogle()
```

### 3.3 User Repository
```typescript
// src/features/auth/data/repositories/user_repository.dart
- createUserProfile(userId, userData)
- getUserProfile(userId)
- updateUserProfile(userId, updates)
- setUserOnline(userId)
- setUserOffline(userId)
```

---

## 💬 Phase 4: Chat System

### 4.1 Conversation Management
```typescript
// src/features/chat/data/repositories/conversation_repository.ts
- createConversation(participants: string[], type: 'direct'|'group')
- getConversations(userId: string, limit: number)
- updateConversationMetadata(conversationId, metadata)
- deleteConversation(conversationId)
```

### 4.2 Message Management
```typescript
// src/features/messages/data/repositories/message_repository.ts
- sendMessage(conversationId, message: Message)
- editMessage(messageId, content)
- deleteMessage(messageId, deleteFor: 'me'|'everyone')
- markAsRead(conversationId, messageIds)
- getMessages(conversationId, limit, startAfter)
```

### 4.3 Real-time Features
```typescript
// src/features/chat/data/repositories/realtime_repository.ts
- observeConversations(userId)
- observeMessages(conversationId)
- observeTypingStatus(conversationId)
- observeOnlineStatus(userId)
- observeUnreadCount(conversationId)
```

---

## 📱 Phase 5: Messaging & Notifications

### 5.1 Firebase Cloud Messaging
```typescript
// src/services/notification/fcm_service.ts
- requestPermissions()
- getDeviceToken()
- subscribeToTopic(conversationId)
- unsubscribeFromTopic(conversationId)
- handleMessage(message)
- handleNotificationTap(message)
```

### 5.2 Local Notifications
```typescript
// src/services/notification/local_notification_service.ts
- showMessageNotification(message, conversationName)
- showCallNotification(caller)
- setupNotificationChannels()
```

### 5.3 Deep Linking
```typescript
// src/services/notification/deep_linking_service.ts
- handleDeepLink(link)
- generateConversationLink(conversationId)
```

---

## 💾 Phase 6: File Management

### 6.1 Storage Service
```typescript
// src/services/storage/firebase_storage_service.ts
- uploadImage(file, conversationId, messageId)
- uploadVideo(file, conversationId, messageId)
- uploadAudio(file, conversationId, messageId)
- uploadFile(file, conversationId, messageId)
- downloadFile(url)
- deleteFile(path)
- getSecureUrl(path, expirationSeconds)
```

### 6.2 Media Compression
```typescript
// src/services/storage/media_compression_service.ts
- compressImage(imagePath, quality)
- generateVideoThumbnail(videoPath)
- compressVideo(videoPath)
- getFileDimensions(filePath)
```

---

## ⚡ Phase 7: Performance Optimization

### 7.1 Pagination
- Implement cursor-based pagination for messages
- Load messages in chunks (e.g., 50 per page)
- Implement bidirectional pagination

### 7.2 Lazy Loading
- Lazy load conversation list
- Virtual list rendering for messages
- Image lazy loading with thumbnails

### 7.3 Query Optimization
- Use collection groups for global searches
- Implement composite indexes
- Cache frequently accessed data
- Implement debouncing for typing status

### 7.4 Data Optimization
- Store only necessary fields in initial queries
- Use Firestore projection
- Implement incremental updates
- Use transactions for consistency

---

## 🔒 Phase 8: Security

### 8.1 Data Validation
```typescript
// src/shared/utils/validators.ts
- validatePhoneNumber(phone)
- validateEmail(email)
- sanitizeMessage(message)
- validateFileSize(size)
- validateFileType(type)
```

### 8.2 Encryption
- Encrypt sensitive data in AsyncStorage
- Use HTTPS for all communications
- Implement end-to-end encryption for messages (optional)

### 8.3 Access Control
- Implement role-based access control
- Prevent unauthorized conversation access
- Rate limiting on message sending

---

## 🏗️ Phase 9: Clean Architecture Implementation

### 9.1 Domain Layer
```
domain/
├── entities/
│   ├── user.entity.ts
│   ├── conversation.entity.ts
│   ├── message.entity.ts
│   └── attachment.entity.ts
├── repositories/
│   ├── auth_repository.abstract.ts
│   ├── conversation_repository.abstract.ts
│   ├── message_repository.abstract.ts
│   └── user_repository.abstract.ts
└── usecases/
    ├── authentication/
    ├── conversations/
    ├── messages/
    └── notifications/
```

### 9.2 Data Layer
```
data/
├── datasources/
│   ├── local/
│   │   └── local_auth_datasource.ts
│   └── remote/
│       ├── firestore_datasource.ts
│       ├── firebase_storage_datasource.ts
│       └── fcm_datasource.ts
├── models/
│   ├── user.model.ts
│   ├── conversation.model.ts
│   ├── message.model.ts
│   └── attachment.model.ts
└── repositories/
    ├── auth_repository_impl.ts
    ├── conversation_repository_impl.ts
    └── message_repository_impl.ts
```

### 9.3 Presentation Layer
```
presentation/
├── bloc/ or state/
│   ├── auth/
│   ├── conversations/
│   ├── messages/
│   └── notifications/
├── pages/
│   ├── auth/
│   ├── chats/
│   └── messages/
├── widgets/
│   ├── message_bubble.dart
│   ├── conversation_tile.dart
│   └── typing_indicator.dart
└── screens/
    ├── login_screen.dart
    ├── home_screen.dart
    └── chat_screen.dart
```

---

## 📊 Implementation Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| 1 | Setup & Structure | 1 day |
| 2 | Core Services | 3 days |
| 3 | Authentication | 2 days |
| 4 | Chat System | 4 days |
| 5 | Notifications | 2 days |
| 6 | File Management | 2 days |
| 7 | Performance | 3 days |
| 8 | Security | 2 days |
| 9 | Architecture | 2 days |
| 10 | Testing & QA | 3 days |

**Total: ~22 days**

---

## ✅ Quality Checklist

- [ ] All CometChat dependencies removed
- [ ] No unused imports or code
- [ ] All screens updated to use Firebase
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Offline support implemented
- [ ] Firestore security rules configured
- [ ] FCM setup and testing complete
- [ ] All features maintained
- [ ] Performance optimized
- [ ] Code documented
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] UI/UX maintained

---

## 🚀 Deployment Steps

1. Create new Firebase project or configure existing
2. Set up Firebase Authentication
3. Create Firestore database with security rules
4. Configure Storage bucket
5. Set up FCM for notifications
6. Deploy Cloud Functions (if needed)
7. Configure Firebase hosting (optional)
8. Test all features
9. Deploy to production

---

## 📚 References

- [Firebase React Native Documentation](https://rnfirebase.io/)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Clean Architecture](https://www.oreilly.com/library/view/clean-architecture/9780134494272/)
- [MVVM Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)

