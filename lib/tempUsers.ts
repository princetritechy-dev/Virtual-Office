export type TempUser = {
  sessionId: string;
  name: string;
  username: string;
  email: string;
  password: string;
  verificationStatus: "pending" | "verified";
  faceImage?: string;
};

export const tempUsers: TempUser[] = [];
export const permanentUsers: TempUser[] = [];