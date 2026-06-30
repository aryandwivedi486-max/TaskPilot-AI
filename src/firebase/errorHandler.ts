import { auth } from './config';
import { OperationType, FirestoreErrorInfo } from '../types';

/**
 * Standardized Firebase Firestore Error Handler
 * Mandated by Firebase Integration security guidelines.
 * Catches permission/operation failures and transforms them into standard JSON exceptions for debugging.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMessage = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };

  console.error('[TaskPilot AI] Firestore Exception Intercepted:', JSON.stringify(errInfo, null, 2));
  
  // Throw a structured JSON error string as required
  throw new Error(JSON.stringify(errInfo));
}

