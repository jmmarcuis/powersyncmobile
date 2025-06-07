// UserProfile.ts
export interface UserProfile {
  uid: string;
  displayName: string;
  height: number;
  weight: number;
  age: number;
  email: string;
  profileImageUrl?: string;  
  createdAt: Date;
  updatedAt?: Date;
}