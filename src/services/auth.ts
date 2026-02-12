import {
  FirebaseAuthTypes,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Session = FirebaseAuthTypes.User;

GoogleSignin.configure({
  webClientId:
    '984491381156-kl32ofsehe10i7h55vj9vdb4ptgrg158.apps.googleusercontent.com',
});

const BACKEND_USER_KEY = 'backend_user';
const BACKEND_SYNCED_KEY = 'backend_synced';

export const authService = {
  getSession: (): Session | null => {
    return getAuth().currentUser;
  },

  signIn: async (): Promise<Session | null> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      const idToken =
        (signInResult as any)?.data?.idToken ??
        (signInResult as any)?.idToken;

      if (!idToken) throw new Error('No ID token');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        getAuth(),
        googleCredential
      );

      return userCredential.user;
    } catch (error: any) {
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS ||
        error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        return null;
      }

      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    await GoogleSignin.signOut();
    await firebaseSignOut(getAuth());
    await AsyncStorage.multiRemove([
      BACKEND_USER_KEY,
      BACKEND_SYNCED_KEY,
    ]);
  },

  onAuthStateChanged: (callback: (user: Session | null) => void) => {
    return firebaseOnAuthStateChanged(getAuth(), callback);
  },

  syncUserWithBackend: async (user: Session): Promise<void> => {
    try {
      const alreadySynced = await AsyncStorage.getItem(BACKEND_SYNCED_KEY);
      if (alreadySynced === 'true') return; // only once

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user.uid,
            name: user.displayName || 'Unknown',
            email: user.email,
            phone: user.phoneNumber,
            profilePic: user.photoURL,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error('Backend sync failed');

      // Save backend user locally
      await AsyncStorage.setItem(
        BACKEND_USER_KEY,
        JSON.stringify(data.data)
      );
      await AsyncStorage.setItem(BACKEND_SYNCED_KEY, 'true');


    } catch (err) {
      if (__DEV__) console.error('Sync failed');
    }
  },

  getBackendUser: async () => {
    const raw = await AsyncStorage.getItem(BACKEND_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
