import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop()
  firstNameAr: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  lastNameAr: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  provider?: string;

  @Prop()
  googleId?: string;

  @Prop()
  linkedinId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  profileId: Types.ObjectId; // Polymorphic: Student | Company | University | Coordinator

  @Prop({
    required: true,
    enum: ['student', 'company', 'university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer', 'admin', 'super_admin'],
  })
  userType: string;

  @Prop({
    default: 'active',
    enum: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
  })
  status: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop()
  avatar: string;

  @Prop()
  phone: string;

  @Prop()
  lastLoginAt: Date;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil: Date;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpiry?: Date;

  @Prop({
    type: [
      {
        token: String,
        createdAt: Date,
        expiresAt: Date,
        deviceInfo: {
          type: { type: String },
          os: String,
          browser: String,
          ip: String,
        },
      },
    ],
    default: [],
  })
  refreshTokens: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
    deviceInfo: {
      type: string;
      os: string;
      browser: string;
      ip: string;
    };
  }>;

  @Prop({
    type: {
      language: { type: String, default: 'en' },
      theme: { type: String, default: 'light' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    default: {},
  })
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };

  @Prop()
  createdBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ roleId: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ createdAt: -1 });
