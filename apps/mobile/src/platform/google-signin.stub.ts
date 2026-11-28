interface GoogleSignInResponse {
  data?: { idToken?: string };
}

interface GoogleSigninInterface {
  configure: (options: {
    iosClientId?: string;
    webClientId?: string;
    scopes?: string[];
  }) => void;
  hasPlayServices: () => Promise<void>;
  signIn: () => Promise<GoogleSignInResponse>;
}

export const GoogleSignin: GoogleSigninInterface = {
  configure: () => {},
  hasPlayServices: async () => {
    throw { code: 'EXPO_GO', message: 'Google Sign-In requires a development build' };
  },
  signIn: async () => {
    throw { code: 'EXPO_GO', message: 'Google Sign-In requires a development build' };
  },
};
