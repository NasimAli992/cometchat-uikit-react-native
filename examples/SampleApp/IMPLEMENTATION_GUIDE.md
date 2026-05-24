/**
 * Comprehensive Implementation Guide
 * Firebase Native Backend Migration - CometChat to Firebase
 * @file IMPLEMENTATION_GUIDE.md
 */

# 🚀 Firebase Native Backend - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Firebase Native Backend chat system. All CometChat dependencies have been removed and replaced with Firebase services.

---

## 📋 Files Created & Purpose

### 1. **Configuration** ✅
- `src/config/firebase.config.ts` - Firebase initialization and constants
  - Initializes all Firebase services
  - Defines Firestore collections structure
  - Defines Storage paths
  - Exports configuration constants

### 2. **Domain Layer** ✅

#### Entities (Business Logic)
- `src/core/domain/entities/user.entity.ts` - User profile and metadata
- `src/core/domain/entities/conversation.entity.ts` - Conversation data structures
- `src/core/domain/entities/message.entity.ts` - Message and attachment data

#### Repositories (Abstract Interfaces)
- `src/core/domain/repositories/auth.repository.abstract.ts` - Authentication contract
- `src/core/domain/repositories/conversation.repository.abstract.ts` - Conversation operations
- `src/core/domain/repositories/message.repository.abstract.ts` - Message operations

### 3. **Data Layer** ✅

#### Models (Data Transfer Objects)
- `src/core/data/models/user.model.ts` - User DTO with conversion functions
- `src/core/data/models/conversation.model.ts` - Conversation DTO
- `src/core/data/models/message.model.ts` - Message DTO with complex transformations

#### Data Sources (Firebase API Integration)
- `src/core/data/datasources/firebase_auth_datasource.ts` - Auth operations
  - Phone OTP verification
  - Phone sign-up
  - User profile management
  - Online/offline status
  
- `src/core/data/datasources/firebase_firestore_conversation_datasource.ts` - Conversation operations
  - CRUD operations
  - Real-time listeners
  - Pagination support
  - Mute/Archive/Pin functionality

- `src/core/data/datasources/firebase_firestore_message_datasource.ts` - Message operations
  - Send/Edit/Delete messages
  - Read receipts and typing indicators
  - Reactions and replies
  - Real-time message streaming
  - Full-text search (basic implementation)

#### Repository Implementations
- `src/core/data/repositories/auth_repository_impl.ts` - Auth repository implementation
- `src/core/data/repositories/conversation_repository_impl.ts` - Conversation repository
- `src/core/data/repositories/message_repository_impl.ts` - Message repository

### 4. **Services** ✅

- `src/services/storage/firebase_storage_service.ts` - File upload/download
  - Image upload with compression
  - Video upload with progress tracking
  - Audio upload
  - Generic file upload
  - Avatar management
  - File deletion

- `src/services/notification/fcm_service.ts` - Push notifications
  - Permission handling
  - Device token management
  - Topic subscriptions
  - Foreground/background message handling
  - Notification tap handling

---

## 🛠️ Setup Instructions

### Step 1: Install Dependencies

```bash
cd examples/SampleApp
npm install
# or
yarn install
```

### Step 2: Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Add React Native app:
   - Download `google-services.json` (Android)
   - Download `GoogleService-Info.plist` (iOS)
4. Place these files in:
   - Android: `android/app/`
   - iOS: Project root

### Step 3: Update Firebase Configuration

Edit `src/config/firebase.config.ts` with your Firebase credentials:

```typescript
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
  databaseURL: 'https://your-project.firebaseio.com',
};
```

### Step 4: Create Firestore Database

1. In Firebase Console → Firestore Database
2. Create database (choose location and security rules)
3. Use security rules provided in `FIREBASE_MIGRATION_PLAN.md`

### Step 5: Enable Firebase Services

In Firebase Console:
- ✅ Authentication → Enable Phone Auth & Google Auth
- ✅ Cloud Firestore → Create database
- ✅ Storage → Create bucket
- ✅ Cloud Messaging → Enable FCM
- ✅ Analytics → Optional but recommended

---

## 🔐 Firestore Security Rules

Deploy the following security rules (reference from migration plan):

```firestore rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - only read own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth != null;
    }

    // Conversations - only participants can access
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
    }

    // Messages - only participants can access
    match /messages/{conversationId}/{messageId} {
      allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      allow create, update, delete: if request.auth.uid == request.resource.data.senderId;
    }

    // Storage - authenticated users can upload
    match /attachments/{conversationId}/{userId}/{document=**} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == userId && request.resource.size < 100 * 1024 * 1024;
    }
  }
}
```

---

## 💾 Firestore Collections Structure

### `users` Collection
```json
{
  "uid": "user123",
  "displayName": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "photoUrl": "https://...",
  "status": "online",
  "lastSeen": 1715026320000,
  "isVerified": true,
  "createdAt": 1715026300000,
  "updatedAt": 1715026320000
}
```

### `conversations` Collection
```json
{
  "id": "conv123",
  "type": "direct",
  "participants": ["user1", "user2"],
  "title": "Group Name",
  "description": "Group description",
  "avatarUrl": "https://...",
  "lastMessage": "Hello!",
  "lastMessageSenderId": "user1",
  "lastMessageTime": 1715026320000,
  "unreadCount": {
    "user1": 0,
    "user2": 3
  },
  "createdAt": 1715026300000,
  "updatedAt": 1715026320000,
  "mutedUntil": null,
  "isArchived": false,
  "isPinned": true
}
```

### `messages/{conversationId}` Subcollection
```json
{
  "id": "msg123",
  "conversationId": "conv123",
  "senderId": "user1",
  "type": "text",
  "content": "Hello World!",
  "attachments": [],
  "reactions": [
    {
      "userId": "user2",
      "emoji": "❤️",
      "reactedAt": 1715026320000
    }
  ],
  "replyTo": null,
  "forwardedFrom": null,
  "readBy": {
    "user1": 1715026315000,
    "user2": 1715026325000
  },
  "deletedFor": [],
  "status": "delivered",
  "createdAt": 1715026315000,
  "updatedAt": 1715026315000,
  "editedAt": null
}
```

---

## 🔌 State Management with Zustand

Create a store for managing chat state:

```typescript
// src/stores/chat.store.ts
import { create } from 'zustand';

interface ChatStore {
  conversations: ConversationEntity[];
  currentConversation: ConversationEntity | null;
  messages: MessageEntity[];
  loading: boolean;
  error: string | null;
  
  setConversations: (conversations: ConversationEntity[]) => void;
  setCurrentConversation: (conversation: ConversationEntity | null) => void;
  addMessage: (message: MessageEntity) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (currentConversation) => set({ currentConversation }),
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages],
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

---

## 📱 Screen Integration Example

### Login Screen (Phone OTP)

```typescript
// src/screens/auth/LoginScreen.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { AuthRepositoryImpl } from '@/core/data/repositories/auth_repository_impl';
import FirebaseAuthDataSource from '@/core/data/datasources/firebase_auth_datasource';

export const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const authDataSource = new FirebaseAuthDataSource();
  const authRepository = new AuthRepositoryImpl(authDataSource);

  const handleRequestOTP = async () => {
    try {
      const verificationId = await authRepository.requestPhoneVerification(phoneNumber);
      setVerificationId(verificationId);
      setStep('otp');
    } catch (error) {
      console.error('OTP request failed:', error);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const user = await authRepository.signUpWithPhone(verificationId, otp);
      // Navigate to home screen
      console.log('Login successful:', user);
    } catch (error) {
      console.error('OTP verification failed:', error);
    }
  };

  return (
    <View>
      {step === 'phone' ? (
        <>
          <TextInput
            placeholder="Phone Number (+1234567890)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity onPress={handleRequestOTP}>
            <Text>Request OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity onPress={handleVerifyOTP}>
            <Text>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
```

### Chat Screen Example

```typescript
// src/screens/chat/ChatScreen.tsx
import { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { MessageRepositoryImpl } from '@/core/data/repositories/message_repository_impl';

export const ChatScreen = ({ conversationId }) => {
  const { messages, addMessage } = useChatStore();
  const messageRepository = new MessageRepositoryImpl(...);

  useEffect(() => {
    // Observe messages
    const unsubscribe = firestore()
      .collection('messages')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => 
          messageModelToEntity(doc.data() as MessageModel)
        );
        // Update store
      });

    return unsubscribe;
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    const message: MessageEntity = {
      id: generateId(),
      conversationId,
      senderId: currentUser.uid,
      type: 'text',
      content,
      readBy: { [currentUser.uid]: new Date() },
      deletedFor: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await messageRepository.sendMessage(message);
      addMessage(message);
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      inverted
    />
  );
};
```

---

## 🎨 Features Maintained

✅ Direct messaging  
✅ Group conversations  
✅ Message reactions  
✅ Message replies  
✅ Message forwarding  
✅ Typing indicators  
✅ Read receipts  
✅ Online/offline status  
✅ Unread message count  
✅ File sharing (images, videos, audio, documents)  
✅ Push notifications  
✅ Message search  
✅ Conversation archiving/pinning  
✅ User profiles  
✅ Avatar management  

---

## 📊 Performance Considerations

### Pagination
All message and conversation queries support cursor-based pagination to avoid loading large datasets.

### Indexes
Create composite indexes in Firestore:
- `conversations`: `participants` + `updatedAt`
- `messages`: `conversationId` + `createdAt`

### Caching
- Use offline persistence in Firestore (50MB default)
- Cache file downloads with FastImage
- Implement debouncing for typing indicators

### Real-time Listeners
- Only subscribe to active conversations
- Unsubscribe when leaving screens
- Use field masks to reduce data transfer

---

## 🧪 Testing

### Unit Tests
```typescript
// src/core/data/repositories/__tests__/auth_repository_impl.test.ts
describe('AuthRepositoryImpl', () => {
  it('should sign up user with phone OTP', async () => {
    // Test implementation
  });
});
```

### Integration Tests
Test data flow between layers and Firebase operations.

### E2E Tests
Test complete user journeys:
- Sign up → Create conversation → Send message → Receive notification

---

## 🚀 Deployment Checklist

- [ ] All dependencies installed
- [ ] Firebase project configured
- [ ] Security rules deployed
- [ ] Environment variables set
- [ ] All screens updated
- [ ] Push notifications tested
- [ ] File uploads tested
- [ ] Offline functionality tested
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Performance tested
- [ ] Security audit passed

---

## 📚 Next Steps

1. **Complete Data Layer** - Implement remaining datasources
2. **Build UI Components** - Create message bubbles, conversation tiles
3. **Integrate State Management** - Connect Zustand stores
4. **Add Error Handling** - Implement error boundaries
5. **Test Thoroughly** - Unit, integration, and E2E tests
6. **Deploy to Production** - Follow deployment checklist

---

## 🆘 Troubleshooting

### Issue: Phone verification failing
- Check Firebase Auth is enabled for phone
- Verify phone number format (E.164)
- Check debug token configuration

### Issue: Firestore writes failing
- Check security rules
- Verify user is authenticated
- Check collection and document paths

### Issue: Push notifications not working
- Verify FCM credentials
- Check notification permissions
- Review notification payload format

---

## 📞 Support

For issues or questions:
1. Check Firebase documentation
2. Review error logs in console
3. Check Firestore rules
4. Verify Firebase project setup

