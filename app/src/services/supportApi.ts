import { type ApiResponse } from '@/types/api.types';
import { apiClient } from './api';

export type ContactRequesterType =
  | 'visitor'
  | 'student'
  | 'university'
  | 'company';

export interface ContactRequestPayload {
  name: string;
  email: string;
  requesterType: ContactRequesterType;
  subject: string;
  message: string;
  language: 'ar' | 'en';
  website?: string;
}

export interface ContactRequestResult {
  requestId: string;
  status: 'new';
  submittedAt: string;
}

export const supportApi = {
  async submitContactRequest(
    payload: ContactRequestPayload,
  ): Promise<ContactRequestResult> {
    const response = await apiClient.post<ApiResponse<ContactRequestResult>>(
      '/support/contact',
      payload,
    );
    return response.data.data;
  },
};
